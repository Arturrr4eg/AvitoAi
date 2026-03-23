import {
  Box,
  Button,
  Card,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputAdornment,
  MenuItem,
  Pagination,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import type { ChangeEvent } from 'react';
import { memo, useEffect, useMemo, useState } from 'react';

import { useItemsQuery } from '@/entities/item/api/item-api';
import { ITEM_CATEGORIES } from '@/entities/item/model/types';
import { ItemCard } from '@/entities/item/ui/item-card';
import { useItemsFiltersStore } from '@/features/items-list-filters/model/filters-store';
import { ItemsLayoutToggle } from '@/features/items-layout-toggle/ui/items-layout-toggle';
import { ThemeToggle } from '@/features/theme-toggle/ui/theme-toggle';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { PageError, PageLoader } from '@/shared/ui/page-state';

const categoryLabels = {
  auto: 'Авто',
  electronics: 'Электроника',
  real_estate: 'Недвижимость',
} as const;

type DebouncedSearchFieldProps = {
  delayMs: number;
  initialValue: string;
  onDebouncedChange: (value: string) => void;
  queryValue: string;
};

const DebouncedSearchField = memo(
  ({ delayMs, initialValue, onDebouncedChange, queryValue }: DebouncedSearchFieldProps) => {
    const [inputValue, setInputValue] = useState(initialValue);
    const debouncedValue = useDebouncedValue(inputValue, delayMs);

    useEffect(() => {
      if (debouncedValue !== queryValue) {
        onDebouncedChange(debouncedValue);
      }
    }, [debouncedValue, queryValue, onDebouncedChange]);

    return (
      <TextField
        fullWidth
        onChange={event => setInputValue(event.target.value)}
        placeholder="Найти объявление..."
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon color="disabled" fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        size="small"
        sx={{ flex: 1, minWidth: 0 }}
        value={inputValue}
      />
    );
  },
);

export const AdsListPage = () => {
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));
  const isXlUp = useMediaQuery(theme.breakpoints.up('xl'));

  const filters = useItemsFiltersStore();
  const [searchResetToken, setSearchResetToken] = useState(0);
  const resetFilters = filters.reset;
  const query = useItemsQuery({
    q: filters.q,
    categories: filters.categories,
    limit: filters.limit,
    needsRevision: filters.needsRevision,
    skip: (filters.page - 1) * filters.limit,
    sortColumn: filters.sortColumn,
    sortDirection: filters.sortDirection,
  });

  const onSortChange = (event: ChangeEvent<HTMLInputElement>) => {
    const [column, direction] = event.target.value.split(':') as ['title' | 'createdAt', 'asc' | 'desc'];
    filters.setSort(column, direction);
  };

  const itemsCount = query.data?.items.length ?? 0;

  const maxColumns = isXlUp ? 5 : isLgUp ? 4 : isMdUp ? 3 : isSmUp ? 2 : 1;

  const gridColumns = useMemo(() => {
    if (maxColumns <= 1) return 1;
    for (let cols = maxColumns; cols >= 2; cols -= 1) {
      if (itemsCount % cols !== 1) return cols;
    }
    return 1;
  }, [itemsCount, maxColumns]);

  if (query.isPending && !query.data) return <PageLoader />;
  if (query.isError) return <PageError message="Не удалось загрузить список объявлений." />;

  const totalPages = Math.max(1, Math.ceil(query.data.total / filters.limit));
  const listHeaderTop = { xs: 12, md: 16 };
  const listHeaderHeight = { xs: 148, md: 128 };
  const leftStickyTop = {
    xs: listHeaderTop.xs + listHeaderHeight.xs + 22,
    md: listHeaderTop.md + listHeaderHeight.md + 22,
  };

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 24px)', md: 'calc(100vh - 48px)' },
        pt: {
          xs: `${listHeaderHeight.xs + 12}px`,
          md: `${listHeaderHeight.md + 14}px`,
        },
      }}
    >
      <Box
        sx={{
          backgroundColor: 'background.default',
          left: 0,
          pointerEvents: 'none',
          position: 'fixed',
          right: 0,
          top: 0,
          height: {
            xs: `${listHeaderTop.xs + listHeaderHeight.xs + 4}px`,
            md: `${listHeaderTop.md + listHeaderHeight.md + 4}px`,
          },
          zIndex: themeValue => themeValue.zIndex.appBar,
        }}
      />

      <Card
        elevation={0}
        sx={{
          backgroundColor: 'background.paper',
          border: themeValue => `1px solid ${themeValue.palette.divider}`,
          borderRadius: 1,
          left: { xs: 12, sm: 16, md: 24 },
          p: { xs: 1.5, md: 2 },
          position: 'fixed',
          right: { xs: 12, sm: 16, md: 24 },
          top: { xs: `${listHeaderTop.xs}px`, md: `${listHeaderTop.md}px` },
          zIndex: themeValue => themeValue.zIndex.appBar + 1,
        }}
      >
        <Stack spacing={1.2}>
          <Stack alignItems="center" direction="row" justifyContent="space-between">
            <Stack spacing={0.25}>
              <Typography component="h1" fontWeight={800} variant="h5">
                Мои объявления
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {query.data.total} объявлений
              </Typography>
            </Stack>
            <ThemeToggle />
          </Stack>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.8}
            sx={{ alignItems: { xs: 'stretch', md: 'center' }, width: '100%' }}
          >
            <DebouncedSearchField
              delayMs={1500}
              initialValue={filters.q}
              onDebouncedChange={filters.setQuery}
              queryValue={filters.q}
              key={searchResetToken}
            />

            <Stack direction="row" spacing={1.4} sx={{ alignItems: 'center', flexShrink: 0 }}>
              <ItemsLayoutToggle />
              <FormControl size="small" sx={{ width: { xs: '100%', md: 290 } }}>
                <TextField
                  onChange={onSortChange}
                  select
                  size="small"
                  value={`${filters.sortColumn}:${filters.sortDirection}`}
                >
                  <MenuItem value="createdAt:desc">По новизне (сначала новые)</MenuItem>
                  <MenuItem value="createdAt:asc">По новизне (сначала старые)</MenuItem>
                  <MenuItem value="title:asc">По названию (А-Я)</MenuItem>
                  <MenuItem value="title:desc">По названию (Я-А)</MenuItem>
                </TextField>
              </FormControl>
            </Stack>
          </Stack>
        </Stack>
      </Card>

      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              border: themeValue => `1px solid ${themeValue.palette.divider}`,
              p: 2,
              position: 'sticky',
              top: { xs: `${leftStickyTop.xs}px`, md: `${leftStickyTop.md}px` },
            }}
          >
            <Stack spacing={1.5}>
              <Typography fontWeight={700} variant="subtitle1">
                Фильтры
              </Typography>
              <FormGroup>
                {ITEM_CATEGORIES.map(category => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.categories.includes(category)}
                        onChange={() => filters.toggleCategory(category)}
                        size="small"
                      />
                    }
                    key={category}
                    label={categoryLabels[category]}
                  />
                ))}
              </FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.needsRevision}
                    onChange={event => filters.setNeedsRevision(event.target.checked)}
                  />
                }
                label="Только требующие доработок"
                labelPlacement="start"
                sx={{ justifyContent: 'space-between', ml: 0 }}
              />
              <Button
                onClick={() => {
                  resetFilters();
                  setSearchResetToken(previous => previous + 1);
                }}
                variant="outlined"
              >
                Сбросить фильтры
              </Button>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 9 }}>
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: filters.layout === 'grid' ? `repeat(${gridColumns}, minmax(0, 1fr))` : '1fr',
            }}
          >
            {query.data.items.map(item => (
              <ItemCard item={item} key={`${item.id}_${item.title}`} layout={filters.layout} />
            ))}
          </Box>
        </Grid>
      </Grid>

      <Stack alignItems="center" sx={{ mt: 'auto', pt: 1 }}>
        <Pagination
          color="primary"
          count={totalPages}
          onChange={(_event, page) => filters.setPage(page)}
          page={filters.page}
          shape="rounded"
          showFirstButton
          showLastButton
        />
      </Stack>
    </Box>
  );
};
