import { Link } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'

import { CreatureImage } from '@/src/features/creatures/components/CreatureImage'
import { useCreatureCatalog, useCreatureTypes } from '@/src/features/creatures/hooks/useCreatureCatalog'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

export default function CreaturesScreen() {
  const { t } = useTranslation()
  const [draftSearch, setDraftSearch] = useState('')
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [retryToken, setRetryToken] = useState(0)
  const types = useCreatureTypes()
  const loadState = useCreatureCatalog({ search, type, page, retryToken })

  const typeOptions = useMemo(
    () => [{ slug: '', name: t('creatures.catalog.allTypes') }, ...types],
    [t, types],
  )

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <FlatList
        contentContainerStyle={styles.content}
        data={loadState.status === 'ready' ? loadState.creatures : []}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>{t('creatures.catalog.eyebrow')}</Text>
            <Text style={styles.title}>{t('creatures.catalog.title')}</Text>
            <Text style={styles.description}>{t('creatures.catalog.description')}</Text>

            <Text style={styles.label}>{t('creatures.catalog.searchLabel')}</Text>
            <TextInput
              value={draftSearch}
              onChangeText={setDraftSearch}
              onSubmitEditing={() => {
                setPage(1)
                setSearch(draftSearch.trim())
              }}
              placeholder={t('creatures.catalog.searchPlaceholder')}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              accessibilityLabel={t('creatures.catalog.searchLabel')}
            />

            <Text style={styles.label}>{t('creatures.catalog.typeLabel')}</Text>
            <View style={styles.chips}>
              {typeOptions.map((option) => {
                const active = type === (option.slug ?? '')
                return (
                  <Pressable
                    key={option.slug || 'all'}
                    onPress={() => {
                      setPage(1)
                      setType(option.slug ?? '')
                    }}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.name}</Text>
                  </Pressable>
                )
              })}
            </View>

            <View style={styles.actions}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => {
                  setPage(1)
                  setSearch(draftSearch.trim())
                }}
              >
                <Text style={styles.primaryButtonText}>{t('creatures.catalog.searchLabel')}</Text>
              </Pressable>
              {(search || type) && (
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => {
                    setDraftSearch('')
                    setSearch('')
                    setType('')
                    setPage(1)
                  }}
                >
                  <Text style={styles.secondaryButtonText}>{t('creatures.catalog.clearAction')}</Text>
                </Pressable>
              )}
            </View>

            {loadState.status === 'loading' && (
              <Text style={styles.feedback}>{t('creatures.catalog.loading')}</Text>
            )}
            {loadState.status === 'error' && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>{t('creatures.catalog.errorTitle')}</Text>
                <Text style={styles.feedback}>{loadState.message}</Text>
                <Pressable style={styles.primaryButton} onPress={() => setRetryToken((value) => value + 1)}>
                  <Text style={styles.primaryButtonText}>{t('common.retry')}</Text>
                </Pressable>
              </View>
            )}
            {loadState.status === 'ready' && loadState.creatures.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>{t('creatures.catalog.emptyTitle')}</Text>
                <Text style={styles.feedback}>{t('creatures.catalog.emptyDescription')}</Text>
              </View>
            )}
            {loadState.status === 'ready' && loadState.creatures.length > 0 && (
              <Text style={styles.feedback}>
                {t('creatures.catalog.resultsSummary', {
                  page: loadState.page,
                  lastPage: loadState.lastPage,
                  total: loadState.total,
                })}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Link href={`/creatures/${item.slug}`} asChild>
            <Pressable style={styles.card}>
              <CreatureImage
                name={item.name}
                imageUrl={item.image_url}
                imageRef={item.image_ref}
                style={styles.cardImage}
              />
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardTypes}>{item.types.map((entry) => entry.name).join(' · ')}</Text>
            </Pressable>
          </Link>
        )}
        ListFooterComponent={
          loadState.status === 'ready' && loadState.creatures.length > 0 ? (
            <View style={styles.pagination}>
              <Pressable
                disabled={loadState.page <= 1}
                onPress={() => setPage((value) => Math.max(1, value - 1))}
                style={[styles.secondaryButton, loadState.page <= 1 && styles.disabled]}
              >
                <Text style={styles.secondaryButtonText}>{t('creatures.catalog.previous')}</Text>
              </Pressable>
              <Pressable
                disabled={loadState.page >= loadState.lastPage}
                onPress={() => setPage((value) => value + 1)}
                style={[styles.secondaryButton, loadState.page >= loadState.lastPage && styles.disabled]}
              >
                <Text style={styles.secondaryButtonText}>{t('creatures.catalog.next')}</Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  eyebrow: {
    color: colors.ember,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    borderColor: colors.ember,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: colors.ember,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.ember,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  primaryButtonText: {
    color: colors.background,
    fontWeight: '800',
  },
  secondaryButton: {
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: '700',
  },
  feedback: {
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  errorBox: {
    backgroundColor: '#2A1518',
    borderColor: colors.danger,
    borderRadius: 14,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  errorTitle: {
    color: colors.danger,
    fontWeight: '800',
  },
  emptyBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  row: {
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardImage: {
    marginBottom: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  cardTypes: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  pagination: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  disabled: {
    opacity: 0.4,
  },
})
