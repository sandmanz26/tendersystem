import { SearchX } from "lucide-react-native"
import * as React from "react"
import { View } from "react-native"

import { Header } from "../ui/domain"
import { Button, EmptyState } from "../ui/primitives"

export function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Header title="Not found" onBack={onBack} />
      <EmptyState icon={SearchX} title="It may have been removed" />
      <Button variant="outline" title="Go back" onPress={onBack} style={{ alignSelf: "center" }} />
    </View>
  )
}
