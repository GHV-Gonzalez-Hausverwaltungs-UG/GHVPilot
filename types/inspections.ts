export type Inspection = {
  id: string;
  title: string;
  date: string;
  status: "geplant" | "inBearbeitung" | "abgeschlossen";
};
