export type MockNpCity = {
  ref: string;
  nameUk: string;
  nameEn: string;
  nameRu: string;
};

export type MockNpPoint = {
  ref: string;
  labelUk: string;
  labelEn: string;
  labelRu: string;
  type: "WAREHOUSE" | "LOCKER";
};

/** Stub Nova Poshta geography — replace with real API later. */
export const MOCK_NP_CITIES: MockNpCity[] = [
  { ref: "kyiv", nameUk: "Київ", nameEn: "Kyiv", nameRu: "Киев" },
  { ref: "lviv", nameUk: "Львів", nameEn: "Lviv", nameRu: "Львов" },
  { ref: "odesa", nameUk: "Одеса", nameEn: "Odesa", nameRu: "Одесса" },
  { ref: "kharkiv", nameUk: "Харків", nameEn: "Kharkiv", nameRu: "Харьков" },
  { ref: "dnipro", nameUk: "Дніпро", nameEn: "Dnipro", nameRu: "Днепр" },
  { ref: "vinnytsia", nameUk: "Вінниця", nameEn: "Vinnytsia", nameRu: "Винница" },
];

const POINTS: Record<string, MockNpPoint[]> = {
  kyiv: [
    {
      ref: "kyiv-1",
      type: "WAREHOUSE",
      labelUk: "Відділення №1: вул. Хрещатик, 1",
      labelEn: "Branch #1: Khreshchatyk St, 1",
      labelRu: "Отделение №1: ул. Крещатик, 1",
    },
    {
      ref: "kyiv-12",
      type: "WAREHOUSE",
      labelUk: "Відділення №12: пр. Перемоги, 45",
      labelEn: "Branch #12: Peremohy Ave, 45",
      labelRu: "Отделение №12: пр. Победы, 45",
    },
    {
      ref: "kyiv-l1",
      type: "LOCKER",
      labelUk: "Поштомат №101: ТРЦ Gulliver",
      labelEn: "Locker #101: Gulliver mall",
      labelRu: "Почтомат №101: ТРЦ Gulliver",
    },
    {
      ref: "kyiv-l2",
      type: "LOCKER",
      labelUk: "Поштомат №205: метро Золоті ворота",
      labelEn: "Locker #205: Zoloti Vorota metro",
      labelRu: "Почтомат №205: метро Золотые ворота",
    },
  ],
  lviv: [
    {
      ref: "lviv-3",
      type: "WAREHOUSE",
      labelUk: "Відділення №3: пл. Ринок, 10",
      labelEn: "Branch #3: Rynok Sq, 10",
      labelRu: "Отделение №3: пл. Рынок, 10",
    },
    {
      ref: "lviv-l1",
      type: "LOCKER",
      labelUk: "Поштомат №11: Forum Lviv",
      labelEn: "Locker #11: Forum Lviv",
      labelRu: "Почтомат №11: Forum Lviv",
    },
  ],
  odesa: [
    {
      ref: "odesa-5",
      type: "WAREHOUSE",
      labelUk: "Відділення №5: Дерибасівська, 22",
      labelEn: "Branch #5: Deribasivska, 22",
      labelRu: "Отделение №5: Дерибасовская, 22",
    },
    {
      ref: "odesa-l1",
      type: "LOCKER",
      labelUk: "Поштомат №7: Привоз",
      labelEn: "Locker #7: Pryvoz",
      labelRu: "Почтомат №7: Привоз",
    },
  ],
  kharkiv: [
    {
      ref: "kharkiv-2",
      type: "WAREHOUSE",
      labelUk: "Відділення №2: вул. Сумська, 15",
      labelEn: "Branch #2: Sumska St, 15",
      labelRu: "Отделение №2: ул. Сумская, 15",
    },
    {
      ref: "kharkiv-l1",
      type: "LOCKER",
      labelUk: "Поштомат №3: Нікольський",
      labelEn: "Locker #3: Nikolsky",
      labelRu: "Почтомат №3: Никольский",
    },
  ],
  dnipro: [
    {
      ref: "dnipro-1",
      type: "WAREHOUSE",
      labelUk: "Відділення №1: пр. Дмитра Яворницького, 50",
      labelEn: "Branch #1: Yavornytskyi Ave, 50",
      labelRu: "Отделение №1: пр. Яворницкого, 50",
    },
  ],
  vinnytsia: [
    {
      ref: "vinnytsia-4",
      type: "WAREHOUSE",
      labelUk: "Відділення №4: Соборна, 30",
      labelEn: "Branch #4: Soborna, 30",
      labelRu: "Отделение №4: Соборная, 30",
    },
  ],
};

export function getMockCities() {
  return MOCK_NP_CITIES;
}

export function getMockCity(ref: string) {
  return MOCK_NP_CITIES.find((city) => city.ref === ref) ?? null;
}

export function getMockPoints(cityRef: string, type?: "WAREHOUSE" | "LOCKER") {
  const points = POINTS[cityRef] ?? [];
  if (!type) return points;
  return points.filter((point) => point.type === type);
}

export function cityLabel(city: MockNpCity, locale: string) {
  if (locale.startsWith("en")) return city.nameEn;
  if (locale.startsWith("ru")) return city.nameRu;
  return city.nameUk;
}

export function pointLabel(point: MockNpPoint, locale: string) {
  if (locale.startsWith("en")) return point.labelEn;
  if (locale.startsWith("ru")) return point.labelRu;
  return point.labelUk;
}
