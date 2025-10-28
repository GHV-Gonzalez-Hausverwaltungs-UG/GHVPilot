export type formdata = {
  object: string;
  entrance?: string;
  floor: string;
  address: {
    street: string;
    city: string;
    zip: string;
  };
  inspector: string;
  responsibility?: string;
  shortage: string;
  measures?: string;
  priority: "hoch" | "mittel" | "niedrig";
  status?: "offen" | "in Bearbeitung" | "erledigt";
  date: string;
  time: string;
  notes?: string;
  files?: File[];
};
