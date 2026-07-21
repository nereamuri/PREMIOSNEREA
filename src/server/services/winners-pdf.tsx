import fs from "node:fs";
import path from "node:path";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { CeremonyCategory } from "./admin/ceremony";

const COLORS = {
  cream: "#F7F2EA",
  ink: "#111111",
  white: "#FFFFFF",
  muted: "#6B6B68",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.cream,
    padding: 48,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  logoBox: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.ink,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  logo: { width: 100, height: 87 },
  eventName: {
    fontSize: 30,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
  },
  categoryLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  categoryName: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
    textAlign: "center",
    marginBottom: 32,
  },
  winnersRow: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    columnGap: 24,
    rowGap: 24,
  },
  winnerCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: 160,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: COLORS.ink,
    objectFit: "cover",
    marginBottom: 12,
  },
  photoFallback: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: COLORS.ink,
    backgroundColor: COLORS.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  photoFallbackText: {
    fontSize: 40,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
  },
  winnerName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
    textAlign: "center",
  },
  winnerDept: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 2,
  },
  noWinner: { fontSize: 14, color: COLORS.muted },
});

function getLogoSrc(): string {
  const logoPath = path.join(process.cwd(), "public", "nereapremios.png");
  const base64 = fs.readFileSync(logoPath).toString("base64");
  return `data:image/png;base64,${base64}`;
}

function WinnersDocument({
  eventName,
  categories,
}: {
  eventName: string;
  categories: CeremonyCategory[];
}) {
  const logoSrc = getLogoSrc();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.logoBox}>
          <Image src={logoSrc} style={styles.logo} />
        </View>
        <Text style={styles.eventName}>{eventName}</Text>
        <Text style={styles.subtitle}>Resumen de ganadores</Text>
      </Page>

      {categories.map((category) => {
        const winners = category.podium.find((p) => p.rank === 1)?.people ?? [];
        return (
          <Page key={category.id} size="A4" style={styles.page}>
            <Text style={styles.categoryLabel}>Categoría</Text>
            <Text style={styles.categoryName}>{category.name}</Text>
            {winners.length === 0 ? (
              <Text style={styles.noWinner}>
                Todavía no hay votos suficientes en esta categoría.
              </Text>
            ) : (
              <View style={styles.winnersRow}>
                {winners.map((winner) => (
                  <View key={winner.id} style={styles.winnerCard}>
                    {winner.photoUrl ? (
                      <Image src={winner.photoUrl} style={styles.photo} />
                    ) : (
                      <View style={styles.photoFallback}>
                        <Text style={styles.photoFallbackText}>
                          {winner.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.winnerName}>{winner.name}</Text>
                    {winner.department && (
                      <Text style={styles.winnerDept}>{winner.department}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </Page>
        );
      })}

      <Page size="A4" style={styles.page}>
        <View style={styles.logoBox}>
          <Image src={logoSrc} style={styles.logo} />
        </View>
        <Text style={styles.eventName}>¡Gracias por participar!</Text>
      </Page>
    </Document>
  );
}

export async function generateWinnersPdf(
  eventName: string,
  categories: CeremonyCategory[]
): Promise<Buffer> {
  return renderToBuffer(
    <WinnersDocument eventName={eventName} categories={categories} />
  );
}
