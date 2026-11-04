import { X } from "lucide-react-native"
import * as React from "react"
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { color, radius } from "../theme"
import { Text } from "./primitives"

/** Plain bottom sheet: backdrop tap, back button and the X all close it. */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  tall,
  children,
}: {
  visible: boolean
  onClose: () => void
  title: string
  subtitle?: string
  tall?: boolean
  children: React.ReactNode
}) {
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <KeyboardAvoidingView pointerEvents="box-none" behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.wrap}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }, tall && { height: "80%" }]}>
          <View style={styles.grabber} />
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text variant="heading">{title}</Text>
              {subtitle && <Text variant="meta">{subtitle}</Text>}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={8}>
              <X size={22} color={color.muted} />
            </Pressable>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  wrap: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    maxHeight: "85%",
  },
  grabber: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: color.border, marginTop: 8 },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
})
