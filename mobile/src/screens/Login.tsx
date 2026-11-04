import * as React from "react"
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { USERS } from "../core/seed"
import { useAppStore } from "../store"
import { color, mono, radius } from "../theme"
import { Button, Field, Input, Text } from "../ui/primitives"

export function LoginScreen() {
  const insets = useSafeAreaInsets()
  const { login } = useAppStore()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  const submit = (e = email, p = password) => setError(login(e, p))
  const demo = USERS.filter((u) => u.status === "active")

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: color.ground }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: insets.top + 48, gap: 28 }}>
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: color.brand, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13, letterSpacing: 0.5 }}>EMI</Text>
            </View>
            <Text variant="label">EVENT MANAGEMENT INVENTORY</Text>
          </View>
          <Text variant="title" style={{ fontSize: 28, marginTop: 18 }}>
            Sign in
          </Text>
          <Text variant="meta">Field app for events, scans and stock counts.</Text>
        </View>

        <View style={{ gap: 14 }}>
          <Field label="Email">
            <Input value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="name@company.id" invalid={!!error} />
          </Field>
          <Field label="Password" error={error ?? undefined}>
            <Input value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" placeholder="••••••••" invalid={!!error} onSubmitEditing={() => submit()} />
          </Field>
          <Button size="lg" title="Sign in" onPress={() => submit()} disabled={!email || !password} />
        </View>

        <View style={{ gap: 8, marginTop: "auto" }}>
          <Text variant="label">DEMO ACCOUNTS</Text>
          <View style={{ borderWidth: 1, borderColor: color.border, borderRadius: radius.card, backgroundColor: color.surface }}>
            {demo.map((u, i) => (
              <Pressable
                key={u.id}
                accessibilityRole="button"
                accessibilityLabel={`Sign in as ${u.name}, ${u.role}`}
                onPress={() => {
                  setEmail(u.email)
                  setPassword(u.password)
                  submit(u.email, u.password)
                }}
                style={({ pressed }) => [
                  { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
                  i > 0 && { borderTopWidth: 1, borderTopColor: color.rule },
                  pressed && { backgroundColor: color.raised },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="strong" style={{ fontSize: 14 }}>
                    {u.name}
                  </Text>
                  <Text variant="tiny" style={{ fontFamily: mono }}>
                    {u.email}
                  </Text>
                </View>
                <Text variant="label">{u.role.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
