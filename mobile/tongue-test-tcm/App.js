import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

const ASSESSMENT_URL = "https://the-tongue-test.vercel.app/tongue-assessment";

const slides = [
  {
    key: "report",
    icon: require("./assets/liver.png"),
    eyebrow: "Your report",
    title: "A clear TCM-style wellness report you can keep.",
    body:
      "Start with reflective questions, add a clear tongue photo, and receive an organ-based educational report.",
  },
  {
    key: "start",
    icon: require("./assets/tongue-logo.png"),
    eyebrow: "Tongue Test TCM",
    title: "Take a clear tongue photo. Get a report you can understand.",
    body:
      "AI-guided tongue observation inspired by Traditional Chinese Medicine, translated into plain-English wellness reflections.",
  },
  {
    key: "founder",
    icon: require("./assets/heart.png"),
    eyebrow: "Founder note",
    title: "Built to make Chinese medicine easier to understand.",
    body:
      "This app is designed to help people notice patterns in digestion, lifestyle rhythm, stress, and overall well-being.",
  },
];

export default function App() {
  const [slideIndex, setSlideIndex] = useState(1);
  const [started, setStarted] = useState(false);
  const slide = slides[slideIndex];

  if (started) {
    return (
      <SafeAreaView style={styles.webShell}>
        <ExpoStatusBar style="dark" />
        <WebView
          source={{ uri: ASSESSMENT_URL }}
          style={styles.webview}
          startInLoadingState
          allowsBackForwardNavigationGestures
          mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
          renderLoading={() => (
            <View style={styles.loader}>
              <ActivityIndicator color="#1F1F1C" />
              <Text style={styles.loaderText}>Opening Tongue Test TCM...</Text>
            </View>
          )}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="dark" />
      <StatusBar barStyle="dark-content" />
      <View style={styles.card}>
        <Image source={slide.icon} style={styles.logo} resizeMode="contain" />
        <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>

        <View style={styles.processLine}>
          <Text style={styles.processText}>Questions</Text>
          <Text style={styles.arrow}>→</Text>
          <Text style={styles.processText}>Photo</Text>
          <Text style={styles.arrow}>→</Text>
          <Text style={styles.processText}>Organ Report</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => setStarted(true)}>
          <Text style={styles.buttonText}>Begin</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Informational only. Not medical advice. Consult a qualified healthcare professional for medical concerns.
        </Text>
      </View>

      <View style={styles.tabs}>
        {slides.map((item, index) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.tab, slideIndex === index && styles.tabActive]}
            onPress={() => setSlideIndex(index)}
          >
            <Image source={item.icon} style={styles.tabIcon} resizeMode="contain" />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E9E4DA",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
  },
  card: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#F8F5EE",
    paddingHorizontal: 26,
    borderRadius: 0,
  },
  logo: {
    alignSelf: "center",
    width: 174,
    height: 174,
    marginBottom: 22,
  },
  eyebrow: {
    color: "#847868",
    fontSize: 12,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 16,
    textAlign: "center",
  },
  title: {
    color: "#20201D",
    fontSize: 38,
    lineHeight: 39,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 18,
  },
  body: {
    color: "#676055",
    fontSize: 16,
    lineHeight: 25,
    textAlign: "center",
    marginBottom: 30,
  },
  processLine: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 30,
  },
  processText: {
    color: "#4D473E",
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  arrow: {
    color: "#B9AA92",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#20201D",
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 13,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  disclaimer: {
    color: "#81796D",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },
  tabs: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  tab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(248,245,238,0.68)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: "#F8F5EE",
    borderWidth: 1,
    borderColor: "#C9BBA4",
  },
  tabIcon: {
    width: 34,
    height: 34,
  },
  webShell: {
    flex: 1,
    backgroundColor: "#F8F5EE",
  },
  webview: {
    flex: 1,
    backgroundColor: "#F8F5EE",
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F5EE",
  },
  loaderText: {
    marginTop: 14,
    color: "#676055",
    fontSize: 14,
  },
});
