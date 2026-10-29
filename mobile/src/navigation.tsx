import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import {
  NavigationContainer,
  DefaultTheme,
  createNavigationContainerRef,
  useNavigation,
  type NavigatorScreenParams,
} from "@react-navigation/native"
import { createNativeStackNavigator, type NativeStackNavigationProp } from "@react-navigation/native-stack"
import { CalendarDays, CircleUserRound, ClipboardList, Package, ScanLine, type LucideIcon } from "lucide-react-native"
import * as React from "react"
import { Text, View } from "react-native"

import type { ReportKind } from "./core/types"
import { EventDetailScreen } from "./screens/EventDetail"
import { HomeScreen } from "./screens/Home"
import { InventoryScreen } from "./screens/Inventory"
import { ItemDetailScreen } from "./screens/ItemDetail"
import { NewReportScreen } from "./screens/NewReport"
import { ProfileScreen } from "./screens/Profile"
import { ReportDetailScreen } from "./screens/ReportDetail"
import { ReportsScreen } from "./screens/Reports"
import { ScannerScreen } from "./screens/Scanner"
import { ScanPickerScreen } from "./screens/ScanPicker"
import { useAppStore } from "./store"
import { color } from "./theme"

export type EventTab = "info" | "items" | "team" | "reports"

export type TabParamList = {
  Home: undefined
  Inventory: undefined
  ScanPicker: undefined
  Reports: undefined
  Profile: undefined
}

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined
  EventDetail: { eventId: string; tab?: EventTab }
  ItemDetail: { code: string; eventId?: string }
  Scanner: { eventId: string }
  NewReport: { eventId?: string; type?: ReportKind; assetCode?: string } | undefined
  ReportDetail: { reportId: string }
}

export type Nav = NativeStackNavigationProp<RootStackParamList>
export const useNav = () => useNavigation<Nav>()
/** For navigating from outside a screen (tests, notifications later). */
export const navigationRef = createNavigationContainerRef<RootStackParamList>()

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: color.ground, primary: color.brand, card: color.surface, border: color.border, text: color.ink },
}

function tabIcon(Icon: LucideIcon, badge?: number) {
  return ({ focused }: { focused: boolean }) => (
    <View
      style={{
        width: 56,
        height: 28,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? color.brandSoft : "transparent",
      }}
    >
      <Icon size={20} color={focused ? color.brand : color.muted} strokeWidth={1.75} />
      {!!badge && (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: 8,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            paddingHorizontal: 4,
            backgroundColor: color.negative,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>{badge}</Text>
        </View>
      )}
    </View>
  )
}

function Tabs() {
  const { reports, userId } = useAppStore()
  // Count only what needs action from this crew member: open reports others raised.
  const open = reports.filter((r) => r.status === "Open" && r.by !== userId).length
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.ink,
        tabBarInactiveTintColor: color.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "500" },
        tabBarStyle: { borderTopColor: color.border, height: 64, paddingTop: 6 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Events", tabBarIcon: tabIcon(CalendarDays) }} />
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{ title: "Items", tabBarIcon: tabIcon(Package) }} />
      <Tab.Screen name="ScanPicker" component={ScanPickerScreen} options={{ title: "Scan", tabBarIcon: tabIcon(ScanLine) }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ title: "Reports", tabBarIcon: tabIcon(ClipboardList, open) }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile", tabBarIcon: tabIcon(CircleUserRound) }} />
    </Tab.Navigator>
  )
}

export function RootNavigator() {
  return (
    <NavigationContainer ref={navigationRef} theme={theme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.ground } }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="EventDetail" component={EventDetailScreen} />
        <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
        <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
        <Stack.Screen name="Scanner" component={ScannerScreen} options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }} />
        <Stack.Screen name="NewReport" component={NewReportScreen} options={{ presentation: "fullScreenModal", animation: "slide_from_bottom", gestureEnabled: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
