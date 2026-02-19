import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register fonts if needed (optional)
// Font.register({
//   family: 'Roboto',
//   src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf'
// });

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  statusBadge: {
    fontSize: 10,
    color: "#16a34a",
    backgroundColor: "#f0fdf4",
    padding: "4 8",
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  statusBadgePending: {
    color: "#F29339",
    backgroundColor: "#FFF7ED",
  },
  infoSection: {
    backgroundColor: "#f0f9ff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeft: "3 solid #3b82f6",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 6,
    fontSize: 10,
    color: "#4b5563",
  },
  infoLabel: {
    fontWeight: "bold",
    width: 100,
  },
  infoValue: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  contentBox: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 6,
    border: "1 solid #e5e7eb",
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 10,
    color: "#4b5563",
    lineHeight: 1.6,
    marginBottom: 8,
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: 4,
    paddingLeft: 12,
  },
  bullet: {
    width: 4,
    marginRight: 8,
    marginTop: 4,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: "#4b5563",
    lineHeight: 1.6,
  },
  divider: {
    borderBottom: "1 solid #e5e7eb",
    marginVertical: 16,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
});

// Helper function to parse markdown-like text into structured content
const parseContent = (text: string) => {
  if (!text) return [];

  const lines = text.split("\n").filter((line) => line.trim());
  const elements = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Headers (##, ###)
    if (line.startsWith("### ")) {
      elements.push({ type: "h3", content: line.replace("### ", "") });
    } else if (line.startsWith("## ")) {
      elements.push({ type: "h2", content: line.replace("## ", "") });
    } else if (line.startsWith("# ")) {
      elements.push({ type: "h1", content: line.replace("# ", "") });
    }
    // Bullet points
    else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push({ type: "bullet", content: line.replace(/^[*-]\s+/, "") });
    }
    // Numbered lists
    else if (/^\d+\.\s+/.test(line)) {
      elements.push({ type: "bullet", content: line.replace(/^\d+\.\s+/, "") });
    }
    // Regular paragraphs
    else {
      elements.push({ type: "paragraph", content: line });
    }
  }

  return elements;
};

// Component to render parsed content
const RenderContent = ({ text }: { text: string }) => {
  const elements = parseContent(text);

  return (
    <>
      {elements.map((element, index) => {
        switch (element.type) {
          case "h2":
            return (
              <Text
                key={index}
                style={[
                  styles.text,
                  {
                    fontSize: 12,
                    fontWeight: "bold",
                    marginTop: 8,
                    marginBottom: 4,
                  },
                ]}
              >
                {element.content}
              </Text>
            );
          case "h3":
            return (
              <Text
                key={index}
                style={[
                  styles.text,
                  {
                    fontSize: 11,
                    fontWeight: "bold",
                    marginTop: 6,
                    marginBottom: 3,
                  },
                ]}
              >
                {element.content}
              </Text>
            );
          case "bullet":
            return (
              <View key={index} style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{element.content}</Text>
              </View>
            );
          case "paragraph":
          default:
            return (
              <Text key={index} style={styles.text}>
                {element.content}
              </Text>
            );
        }
      })}
    </>
  );
};

// Main PDF Document Component
export const SummaryPDFDocument = ({ summary }: { summary: any }) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Timeline Summary - Version {summary.version}
          </Text>
          <Text
            style={[
              styles.statusBadge,
              summary.status !== "Approved" && styles.statusBadgePending,
            ]}
          >
            {summary.status.toUpperCase()}
          </Text>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>TIMELINE SUMMARY INFO</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Generated:</Text>
            <Text style={styles.infoValue}>
              {formatDate(summary.createdAt)}
            </Text>
          </View>

          {summary.approvedBy && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Approved by:</Text>
              <Text style={styles.infoValue}>
                {summary.approvedBy.name} on {formatDate(summary.approvedAt)}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Coverage:</Text>
            <Text style={styles.infoValue}>
              {summary.sessionCount} sessions ({formatDate(summary.periodStart)}{" "}
              - {formatDate(summary.periodEnd)})
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Included:</Text>
            <Text style={styles.infoValue}>
              {summary.sessionCount} Summary notes, {summary.fileCount} uploaded
              files
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Generated by:</Text>
            <Text style={styles.infoValue}>
              {summary.generatedBy?.name || "System"}
            </Text>
          </View>
        </View>

        {/* Main Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline Summary Details</Text>
          <View style={styles.contentBox}>
            <RenderContent
              text={summary.summaryText || "No summary text available"}
            />
          </View>
        </View>

        {/* Summary Sections */}
        {summary.summaryContent?.sections && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary Sections</Text>
            {Object.entries(summary.summaryContent.sections).map(
              ([key, value]: [string, any], index) => (
                <View key={key} style={styles.contentBox}>
                  <Text style={styles.subsectionTitle}>
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())
                      .trim()}
                  </Text>
                  <RenderContent text={value || "No content provided."} />
                </View>
              ),
            )}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer} fixed>
          Generated on {formatDate(new Date().toISOString())} | Page{" "}
        </Text>
      </Page>
    </Document>
  );
};
