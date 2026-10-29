import type { LucideIcon } from "lucide-react-native"
import * as React from "react"
import {
  Linking,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native"

import { color, font, radius, tabular } from "../theme"

/* ---------- Text ---------- */

type TextVariant = "title" | "heading" | "body" | "strong" | "small" | "meta" | "tiny" | "figure"

export function Text({
  variant = "body",
  muted,
  style,
  ...props
}: TextProps & { variant?: TextVariant; muted?: boolean }) {
  return <RNText {...props} style={[textStyles[variant], muted && { color: color.muted }, style]} />
}

const textStyles = StyleSheet.create({
  title: { fontSize: font.title, fontWeight: "700", color: color.ink, letterSpacing: -0.3 },
  heading: { fontSize: font.heading, fontWeight: "600", color: color.ink },
  body: { fontSize: font.body, color: color.ink, lineHeight: 21 },
  strong: { fontSize: font.body, fontWeight: "600", color: color.ink },
  small: { fontSize: font.small, color: color.ink, lineHeight: 20 },
  meta: { fontSize: font.meta, color: color.muted, lineHeight: 18 },
  tiny: { fontSize: font.tiny, color: color.muted },
  figure: { fontSize: font.figure, fontWeight: "600", color: color.ink, letterSpacing: -0.6, ...tabular },
})

/* ---------- Button ---------- */

type ButtonVariant = "primary" | "outline" | "secondary" | "ghost" | "destructive"

export function Button({
  title,
  icon: Icon,
  variant = "primary",
  size = "md",
  disabled,
  onPress,
  style,
  accessibilityLabel,
}: {
  title?: string
  icon?: LucideIcon
  variant?: ButtonVariant
  size?: "md" | "lg" | "icon"
  disabled?: boolean
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}) {
  const v = disabled ? buttonVariants.disabled : buttonVariants[variant]
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        size === "lg" && { height: 50 },
        size === "icon" && { width: 44, paddingHorizontal: 0 },
        v.box,
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {Icon && <Icon size={18} color={v.fg} strokeWidth={2} />}
      {title ? <RNText style={[styles.buttonText, { color: v.fg }, size === "lg" && { fontSize: 16 }]}>{title}</RNText> : null}
    </Pressable>
  )
}

const buttonVariants: Record<ButtonVariant | "disabled", { box: ViewStyle; fg: string }> = {
  primary: { box: { backgroundColor: color.brand }, fg: "#fff" },
  outline: { box: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.control }, fg: color.ink },
  secondary: { box: { backgroundColor: color.raised }, fg: color.ink },
  ghost: { box: { backgroundColor: "transparent" }, fg: color.ink },
  destructive: { box: { backgroundColor: color.surface, borderWidth: 1, borderColor: "#f1b5b7" }, fg: color.negative },
  // Disabled stays legible: a grey fill, not a faded colour.
  disabled: { box: { backgroundColor: color.raised }, fg: color.muted },
}

/* ---------- Badge ---------- */

export type BadgeVariant = "accent" | "warning" | "success" | "danger" | "neutral" | "outline"

export function Badge({ label, variant = "neutral", dot }: { label: string; variant?: BadgeVariant; dot?: string }) {
  const v = badgeVariants[variant]
  return (
    <View style={[styles.badge, { backgroundColor: v.bg, borderColor: v.border ?? v.bg }]}>
      {dot && <View style={[styles.badgeDot, { backgroundColor: dot }]} />}
      <RNText style={[styles.badgeText, { color: v.fg }]} numberOfLines={1}>
        {label}
      </RNText>
    </View>
  )
}

const badgeVariants: Record<BadgeVariant, { bg: string; fg: string; border?: string }> = {
  accent: { bg: color.brandSoft, fg: color.brandInk },
  warning: { bg: color.pillWarningBg, fg: color.pillWarningInk },
  success: { bg: color.pillPositiveBg, fg: color.pillPositiveInk },
  danger: { bg: color.pillNegativeBg, fg: color.pillNegativeInk },
  neutral: { bg: color.raised, fg: "#374151" },
  outline: { bg: color.surface, fg: color.ink, border: color.border },
}

/* ---------- Surfaces ---------- */

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>
}

/** Bordered card whose children are rows split by a 1px rule. */
export function ListCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const rows = React.Children.toArray(children).filter(Boolean)
  return (
    <View style={[styles.card, { marginHorizontal: 16, overflow: "hidden" }, style]}>
      {rows.map((child, i) => (
        <View key={i} style={i > 0 && styles.rule}>
          {child}
        </View>
      ))}
    </View>
  )
}

export function Row({ children, style, ...props }: PressableProps & { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.row, pressed && props.onPress && { backgroundColor: color.raised }, style]}>
      {children}
    </Pressable>
  )
}

export function SectionLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <RNText style={styles.sectionText} accessibilityRole="header">
        {children}
      </RNText>
      {right}
    </View>
  )
}

export function EmptyState({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <View style={styles.empty}>
      <Icon size={24} color={color.muted} strokeWidth={1.75} />
      <Text variant="strong" style={{ marginTop: 10 }}>
        {title}
      </Text>
    </View>
  )
}

export function Callout({
  icon: Icon,
  tone = "warning",
  children,
  style,
}: {
  icon: LucideIcon
  tone?: "warning" | "info" | "accent"
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const t =
    tone === "warning"
      ? { bg: color.pillWarningBg, fg: color.pillWarningInk, border: color.pillWarningBorder }
      : tone === "accent"
        ? { bg: color.brandSoft, fg: color.brandInk, border: color.brandSoft }
        : { bg: color.raised, fg: color.ink, border: color.raised }
  return (
    <View style={[styles.callout, { backgroundColor: t.bg, borderColor: t.border }, style]}>
      <Icon size={16} color={t.fg} strokeWidth={1.75} style={{ marginTop: 2 }} />
      <RNText style={{ flex: 1, color: t.fg, fontSize: font.small, lineHeight: 20 }}>{children}</RNText>
    </View>
  )
}

/* ---------- Chips ---------- */

export function Chip({
  label,
  count,
  selected,
  onPress,
}: {
  label: string
  count?: number
  selected?: boolean
  onPress?: () => void
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: !!selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}
    >
      <RNText style={[styles.chipText, selected && { color: color.brandInk }]}>{label}</RNText>
      {count !== undefined && <RNText style={[styles.chipCount, selected && { color: color.brandInk }]}>{count}</RNText>}
    </Pressable>
  )
}

/* ---------- Icon + value ---------- */

/** An icon standing in for a label: "06:00" next to a clock reads faster than "Call time 06:00". */
export function Meta({
  icon: Icon,
  children,
  label,
  style,
  textStyle,
}: {
  icon: LucideIcon
  children: React.ReactNode
  label?: string
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}) {
  return (
    <View style={[styles.meta, style]} accessible accessibilityLabel={label ? `${label}: ${String(children)}` : undefined}>
      <Icon size={14} color={color.muted} strokeWidth={1.75} />
      <RNText style={[styles.metaText, textStyle]} numberOfLines={1}>
        {children}
      </RNText>
    </View>
  )
}

export function MetaRow({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.metaRow, style]}>{children}</View>
}

/* ---------- Action bar ---------- */

export interface Action {
  icon: LucideIcon
  label: string
  onPress?: () => void
  url?: string
  primary?: boolean
  disabled?: boolean
}

/** The frequent jobs as thumb-sized buttons, icon over a one-word label. */
export function ActionBar({ actions, style }: { actions: Action[]; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.actionBar, style]}>
      {actions.map((a) => {
        const fg = a.disabled ? color.muted : a.primary ? "#fff" : color.ink
        return (
          <Pressable
            key={a.label}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            accessibilityState={{ disabled: a.disabled }}
            disabled={a.disabled}
            onPress={() => (a.url ? Linking.openURL(a.url).catch(() => {}) : a.onPress?.())}
            style={({ pressed }) => [
              styles.action,
              a.primary && !a.disabled && { backgroundColor: color.brand, borderColor: color.brand },
              a.disabled && { backgroundColor: color.raised },
              pressed && { opacity: 0.85 },
            ]}
          >
            <a.icon size={20} color={fg} strokeWidth={1.75} />
            <RNText style={[styles.actionText, { color: fg }]}>{a.label}</RNText>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: radius.control,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: { fontSize: 15, fontWeight: "600" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: font.tiny, fontWeight: "500" },
  card: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.border, borderRadius: radius.card },
  rule: { borderTopWidth: 1, borderTopColor: color.rule },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  section: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 8,
  },
  sectionText: { fontSize: 15, fontWeight: "600", color: color.ink },
  empty: { alignItems: "center", paddingVertical: 44, paddingHorizontal: 32 },
  callout: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: radius.card, padding: 12 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.control,
    backgroundColor: color.surface,
  },
  chipOn: { borderColor: color.brand, backgroundColor: color.brandSoft },
  chipText: { fontSize: font.meta, fontWeight: "500", color: color.ink },
  chipCount: { fontSize: font.meta, color: color.muted, ...tabular },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 },
  metaText: { fontSize: font.meta, color: color.muted, ...tabular, flexShrink: 1 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 12, rowGap: 4 },
  actionBar: { flexDirection: "row", gap: 8 },
  action: {
    flex: 1,
    height: 64,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  actionText: { fontSize: font.meta, fontWeight: "500" },
})
