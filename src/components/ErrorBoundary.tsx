import React from "react";
import { Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText as Text } from "./AppText";
import { styles, theme } from "../styles/appStyles";

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: "",
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Screen crashed:", error, errorInfo);
  }

  private retry = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Se produjo un error</Text>
          <Text style={styles.subtitle}>La pantalla falló, pero puedes continuar usando la app.</Text>

          <Pressable style={styles.primaryButton} onPress={this.retry}>
            <Text style={styles.primaryButtonText}>Reintentar</Text>
          </Pressable>
          <Text style={{ marginTop: 10, color: theme.textMuted, fontSize: 12 }}>
            {this.state.errorMessage || "Error desconocido"}
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }
}
