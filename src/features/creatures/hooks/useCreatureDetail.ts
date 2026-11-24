import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ApiError } from '@/src/shared/lib/api-client';

import { fetchCreatureBySlug } from '../api/creatures';
import type { Creature } from '../types';

type DetailState =
  | { status: 'loading' }
  | { status: 'error'; message: string; notFound?: boolean }
  | { status: 'ready'; creature: Creature };

export function useCreatureDetail(slug: string, retryToken: number): DetailState {
  const { t, i18n } = useTranslation();
  const [state, setState] = useState<DetailState>({ status: 'loading' });

  useEffect(() => {
    if (!slug) {
      setState({ status: 'error', message: t('errors.missingSlug'), notFound: true });
      return;
    }

    const controller = new AbortController();
    setState({ status: 'loading' });

    fetchCreatureBySlug(slug, controller.signal)
      .then((response) => setState({ status: 'ready', creature: response.data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (error instanceof ApiError && error.status === 404) {
          setState({ status: 'error', message: t('errors.notFound'), notFound: true });
          return;
        }

        const message = error instanceof ApiError ? error.message : t('errors.detailLoad');
        setState({ status: 'error', message });
      });

    return () => controller.abort();
  }, [i18n.resolvedLanguage, retryToken, slug, t]);

  return state;
}
