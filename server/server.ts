import Fastify from 'fastify';

import items from 'data/items.json' with { type: 'json' };
import { Item } from 'src/types.ts';
import { ItemsGetInQuerySchema, ItemUpdateInSchema } from 'src/validation.ts';
import { treeifyError, ZodError } from 'zod';
import { doesItemNeedRevision } from './src/utils.ts';

const ITEMS = items as Item[];

const fastify = Fastify({
  logger: true,
});

await fastify.register((await import('@fastify/middie')).default);

// Искуственная задержка ответов, чтобы можно было протестировать состояния загрузки
fastify.use((_, __, next) =>
  new Promise(res => setTimeout(res, 300 + Math.random() * 700)).then(next),
);

// Настройка CORS
fastify.use((request, reply, next) => {
  reply.setHeader('Access-Control-Allow-Origin', '*');
  reply.setHeader('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE,OPTIONS');
  reply.setHeader(
    'Access-Control-Allow-Headers',
    request.headers['access-control-request-headers'] ?? 'Content-Type, Authorization',
  );

  if (request.method === 'OPTIONS') {
    reply.statusCode = 204;
    reply.end();
    return;
  }

  next();
});

interface ItemGetRequest extends Fastify.RequestGenericInterface {
  Params: {
    id: string;
  };
}



// ---------- LLM PROXY ----------
fastify.post('/llm', async (request, reply) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const defaultModel = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  if (!apiKey) {
    reply.status(500).send({ error: 'OPENROUTER_API_KEY is not set' });
    return;
  }

  const body = request.body as {
    messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    model?: string;
    maxTokens?: number;
    plugins?: Array<{ id: string; max_results?: number }>;
  };

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: body.model || defaultModel,
        messages: body.messages || [],
        max_tokens: body.maxTokens ?? 220,
        plugins: body.plugins,
      }),
    });

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      reply.status(response.status).send(data);
      return;
    }

    const text = data.choices?.[0]?.message?.content?.trim();

    if (!text) {
      reply.status(502).send({ error: 'Empty response from OpenRouter' });
      return;
    }

    reply.send({ text });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: 'Failed to call OpenRouter' });
  }
});




fastify.get<ItemGetRequest>('/items/:id', (request, reply) => {
  const itemId = Number(request.params.id);

  if (!Number.isFinite(itemId)) {
    reply
      .status(400)
      .send({ success: false, error: 'Item ID path param should be a number' });
    return;
  }

  const item = ITEMS.find(item => item.id === itemId);

  if (!item) {
    reply
      .status(404)
      .send({ success: false, error: "Item with requested id doesn't exist" });
    return;
  }

  return {
    ...item,
    needsRevision: doesItemNeedRevision(item),
  };
});

interface ItemsGetRequest extends Fastify.RequestGenericInterface {
  Querystring: {
    q?: string;
    limit?: string;
    skip?: string;
    categories?: string;
    needsRevision?: string;
  };
}

fastify.get<ItemsGetRequest>('/items', request => {
  const {
    q,
    limit,
    skip,
    needsRevision,
    categories,
    sortColumn,
    sortDirection,
  } = ItemsGetInQuerySchema.parse(request.query);

  const filteredItems = ITEMS.filter(item => {
    return (
      item.title.toLowerCase().includes(q.toLowerCase()) &&
      (!needsRevision || doesItemNeedRevision(item)) &&
      (!categories?.length ||
        categories.some(category => item.category === category))
    );
  });

  return {
    items: filteredItems
      .toSorted((item1, item2) => {
        let comparisonValue = 0;

        if (!sortDirection) return comparisonValue;

        if (sortColumn === 'title') {
          comparisonValue = item1.title.localeCompare(item2.title);
        } else if (sortColumn === 'createdAt') {
          comparisonValue =
            new Date(item1.createdAt).valueOf() -
            new Date(item2.createdAt).valueOf();
        }

        return (sortDirection === 'desc' ? -1 : 1) * comparisonValue;
      })
      .slice(skip, skip + limit)
      .map(item => ({
        id: item.id,
        category: item.category,
        title: item.title,
        price: item.price,
        needsRevision: doesItemNeedRevision(item),
      })),
    total: filteredItems.length,
  };
});

interface ItemUpdateRequest extends Fastify.RequestGenericInterface {
  Params: {
    id: string;
  };
}

fastify.put<ItemUpdateRequest>('/items/:id', (request, reply) => {
  const itemId = Number(request.params.id);

  if (!Number.isFinite(itemId)) {
    reply
      .status(400)
      .send({ success: false, error: 'Item ID path param should be a number' });
    return;
  }

  const itemIndex = ITEMS.findIndex(item => item.id === itemId);

  if (itemIndex === -1) {
    reply
      .status(404)
      .send({ success: false, error: "Item with requested id doesn't exist" });
    return;
  }

  try {
    const parsedData = ItemUpdateInSchema.parse({
      category: ITEMS[itemIndex].category,
      ...(request.body as {}),
    });

    ITEMS[itemIndex] = {
      id: ITEMS[itemIndex].id,
      createdAt: ITEMS[itemIndex].createdAt,
      updatedAt: new Date().toISOString(),
      ...parsedData,
    };

    return { success: true };
  } catch (error) {
    if (error instanceof ZodError) {
      reply.status(400).send({ success: false, error: treeifyError(error) });
      return;
    }

    throw error;
  }
});

const parsedPort = Number(process.env.PORT);
const port = Number.isFinite(parsedPort) ? parsedPort : 8080;

fastify.listen({ port, host: '0.0.0.0' }, function (err, _address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  fastify.log.debug(`Server is listening on port ${port}`);
});
