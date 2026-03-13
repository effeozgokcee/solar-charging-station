// -*- coding: utf-8 -*-
import React, { useEffect, useRef, memo } from "react";
import {
  View, StyleSheet, Animated, TouchableWithoutFeedback,
  ScrollView, PanResponder, Dimensions,
} from "react-native";
import { Text } from "react-native-paper";

const SCREEN_H = Dimensions.get("window").height;

export interface DrawerContent {
  title: string;
  unit: string;
  formula: string;
  explanation: string;
  funFact: string;
}

interface Props {
  visible: boolean;
  content: DrawerContent | null;
  onClose: () => void;
}

function InfoDrawer({ visible, content, onClose }: Props) {
  const slideY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) slideY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          onClose();
        } else {
          Animated.spring(slideY, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, { toValue: SCREEN_H, duration: 250, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, slideY, backdropOpacity]);

  if (!content && !visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? "auto" : "none"}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideY }] }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        {content && (
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} bounces>
            <Text style={styles.title}>{content.title}</Text>

            <View style={styles.unitRow}>
              <Text style={styles.unitLabel}>Birim</Text>
              <Text style={styles.unitValue}>{content.unit}</Text>
            </View>

            <View style={styles.formulaCard}>
              <Text style={styles.formulaLabel}>FORM\u00DCL</Text>
              <Text style={styles.formulaText}>{content.formula}</Text>
            </View>

            <Text style={styles.sectionLabel}>A\u00C7IKLAMA</Text>
            <Text style={styles.explanation}>{content.explanation}</Text>

            <View style={styles.funFactCard}>
              <Text style={styles.funFactIcon}>{"\uD83D\uDCA1"}</Text>
              <Text style={styles.funFactText}>{content.funFact}</Text>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}

export default memo(InfoDrawer);

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#1C1C1E", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: SCREEN_H * 0.7, minHeight: 300,
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: -5 },
    elevation: 20,
  },
  handleRow: { alignItems: "center", paddingTop: 10, paddingBottom: 8 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#3A3A3C" },
  scrollContent: { paddingHorizontal: 24 },
  title: { color: "#FFFFFF", fontSize: 22, fontWeight: "700", letterSpacing: -0.3, marginBottom: 16 },
  unitRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#2C2C2E", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, minHeight: 44,
  },
  unitLabel: { color: "rgba(235,235,245,0.6)", fontSize: 15, letterSpacing: -0.3 },
  unitValue: { color: "#FFD60A", fontSize: 15, fontWeight: "600", letterSpacing: -0.3 },
  formulaCard: {
    backgroundColor: "#2C2C2E", borderRadius: 12, padding: 16, marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: "#FFD60A",
  },
  formulaLabel: { color: "rgba(235,235,245,0.3)", fontSize: 11, fontWeight: "600", letterSpacing: 0.5, marginBottom: 6 },
  formulaText: { color: "#FFFFFF", fontSize: 20, fontWeight: "600", letterSpacing: -0.3 },
  sectionLabel: { color: "rgba(235,235,245,0.3)", fontSize: 11, fontWeight: "600", letterSpacing: 0.5, marginBottom: 8 },
  explanation: { color: "rgba(235,235,245,0.85)", fontSize: 16, lineHeight: 24, letterSpacing: -0.3, marginBottom: 16 },
  funFactCard: {
    flexDirection: "row", backgroundColor: "rgba(255,214,10,0.08)", borderRadius: 12,
    padding: 14, gap: 10, alignItems: "flex-start",
  },
  funFactIcon: { fontSize: 18 },
  funFactText: { color: "rgba(235,235,245,0.6)", fontSize: 14, lineHeight: 20, letterSpacing: -0.3, flex: 1 },
});
