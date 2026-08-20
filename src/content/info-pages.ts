import type { AppLocale } from "@/i18n/config";
import { defaultLocale, isAppLocale } from "@/i18n/config";

export type InfoSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type InfoPageContent = {
  lead: string;
  sections: InfoSection[];
};

function resolveLocale(locale: string): AppLocale {
  return isAppLocale(locale) ? locale : defaultLocale;
}

const about: Record<AppLocale, InfoPageContent> = {
  uk: {
    lead: "D&A (Dreams & Anime) — магазин аніме-мерчу, фігурок, манги та косплею для тих, хто хоче жити улюбленими світами щодня.",
    sections: [
      {
        heading: "Хто ми",
        paragraphs: [
          "Ми збираємо перевірені позиції від надійних постачальників і доповнюємо асортимент власними дропами D&A Studio.",
          "Наша мета — швидка доставка Україною, чесні описи та підтримка, яка реально допоможе з вибором.",
        ],
      },
      {
        heading: "Що продаємо",
        paragraphs: ["У каталозі знайдете:"],
        bullets: [
          "фігурки та статуетки",
          "мерч і одяг за фендомами",
          "мангу, постери, наліпки та аксесуари",
          "косплей-елементи та подарункові набори",
        ],
      },
      {
        heading: "Цінності",
        paragraphs: [
          "Оригінальність поставок, прозорі залишки, дбайлива упаковка і маленький сюрприз до замовлення — це наш стандарт.",
        ],
      },
    ],
  },
  en: {
    lead: "D&A (Dreams & Anime) is an anime merch, figures, manga and cosplay shop for people who want to live their favorite worlds every day.",
    sections: [
      {
        heading: "Who we are",
        paragraphs: [
          "We curate verified products from trusted suppliers and expand the catalog with our own D&A Studio drops.",
          "We focus on fast delivery across Ukraine, honest product descriptions, and support that actually helps you choose.",
        ],
      },
      {
        heading: "What we sell",
        paragraphs: ["In the catalog you will find:"],
        bullets: [
          "figures and statues",
          "fandom merch and apparel",
          "manga, posters, stickers and accessories",
          "cosplay pieces and gift sets",
        ],
      },
      {
        heading: "Our values",
        paragraphs: [
          "Authentic sourcing, transparent stock, careful packaging and a small surprise with every order — that’s our baseline.",
        ],
      },
    ],
  },
  ru: {
    lead: "D&A (Dreams & Anime) — магазин аниме-мерча, фигурок, манги и косплея для тех, кто хочет жить любимыми мирами каждый день.",
    sections: [
      {
        heading: "Кто мы",
        paragraphs: [
          "Мы собираем проверенные позиции от надёжных поставщиков и дополняем ассортимент собственными дропами D&A Studio.",
          "Наша цель — быстрая доставка по Украине, честные описания и поддержка, которая реально помогает с выбором.",
        ],
      },
      {
        heading: "Что продаём",
        paragraphs: ["В каталоге найдёте:"],
        bullets: [
          "фигурки и статуэтки",
          "мерч и одежду по фэндомам",
          "мангу, постеры, наклейки и аксессуары",
          "косплей-элементы и подарочные наборы",
        ],
      },
      {
        heading: "Ценности",
        paragraphs: [
          "Оригинальность поставок, прозрачные остатки, аккуратная упаковка и маленький сюрприз к заказу — наш стандарт.",
        ],
      },
    ],
  },
};

const delivery: Record<AppLocale, InfoPageContent> = {
  uk: {
    lead: "Доставляємо Новою Поштою по всій Україні. Безкоштовна доставка від 1500 ₴.",
    sections: [
      {
        heading: "Способи доставки",
        paragraphs: ["Оберіть зручний варіант під час оформлення:"],
        bullets: [
          "відділення Нової Пошти",
          "поштомат",
          "адресна курʼєрська доставка",
        ],
      },
      {
        heading: "Терміни",
        paragraphs: [
          "Замовлення в наявності зазвичай відправляємо протягом 1–2 робочих днів після підтвердження повної онлайн-оплати.",
          "Час у дорозі залежить від регіону і зазвичай становить 1–3 дні після відправки.",
        ],
      },
      {
        heading: "Оплата",
        paragraphs: [
          "Приймаємо лише повну передоплату онлайн. Накладеного платежу немає.",
        ],
        bullets: ["онлайн-оплата карткою (повна сума замовлення)"],
      },
      {
        heading: "Вартість доставки",
        paragraphs: [
          "Від 1500 ₴ доставка безкоштовна. Нижче порогу вартість розраховується за тарифами перевізника під час checkout.",
        ],
      },
    ],
  },
  en: {
    lead: "We ship with Nova Poshta across Ukraine. Free shipping from 1500 ₴.",
    sections: [
      {
        heading: "Shipping options",
        paragraphs: ["Choose a convenient option at checkout:"],
        bullets: ["Nova Poshta branch", "parcel locker", "courier to your address"],
      },
      {
        heading: "Timing",
        paragraphs: [
          "In-stock orders usually ship within 1–2 business days after full online payment is confirmed.",
          "Transit typically takes 1–3 days after dispatch depending on the region.",
        ],
      },
      {
        heading: "Payment",
        paragraphs: [
          "We only accept full prepaid online payment. Cash on delivery is not available.",
        ],
        bullets: ["online card payment (full order amount)"],
      },
      {
        heading: "Shipping cost",
        paragraphs: [
          "Shipping is free from 1500 ₴. Below the threshold, the carrier rate is calculated at checkout.",
        ],
      },
    ],
  },
  ru: {
    lead: "Доставляем Новой Почтой по всей Украине. Бесплатная доставка от 1500 ₴.",
    sections: [
      {
        heading: "Способы доставки",
        paragraphs: ["Выберите удобный вариант при оформлении:"],
        bullets: ["отделение Новой Почты", "поштомат", "адресная курьерская доставка"],
      },
      {
        heading: "Сроки",
        paragraphs: [
          "Заказы в наличии обычно отправляем в течение 1–2 рабочих дней после подтверждения полной онлайн-оплаты.",
          "В пути обычно 1–3 дня после отправки — зависит от региона.",
        ],
      },
      {
        heading: "Оплата",
        paragraphs: [
          "Принимаем только полную предоплату онлайн. Наложенного платежа нет.",
        ],
        bullets: ["онлайн-оплата картой (полная сумма заказа)"],
      },
      {
        heading: "Стоимость доставки",
        paragraphs: [
          "От 1500 ₴ доставка бесплатная. Ниже порога стоимость считается по тарифам перевозчика на checkout.",
        ],
      },
    ],
  },
};

const returns: Record<AppLocale, InfoPageContent> = {
  uk: {
    lead: "Якщо товар не підійшов — поверніть його протягом 14 днів з моменту отримання.",
    sections: [
      {
        heading: "Умови повернення",
        paragraphs: ["Повернення можливе, якщо:"],
        bullets: [
          "збережено товарний вигляд і комплектацію",
          "є підтвердження покупки (номер замовлення)",
          "товар не входить до винятків (наприклад, персоналізовані позиції)",
        ],
      },
      {
        heading: "Як оформити",
        paragraphs: [
          "Заповніть форму нижче на цій сторінці: номер замовлення, email і товари, які повертаєте.",
          "Також можна написати на email або в Telegram. Після перевірки товару повернемо кошти тим самим способом оплати.",
        ],
      },
      {
        heading: "Брак або помилка відправки",
        paragraphs: [
          "Якщо отримали бракований або неправильний товар — заміна або повернення за наш рахунок. Звʼяжіться з нами протягом 48 годин після отримання.",
        ],
      },
    ],
  },
  en: {
    lead: "If an item doesn’t fit, return it within 14 days of delivery.",
    sections: [
      {
        heading: "Return conditions",
        paragraphs: ["A return is possible if:"],
        bullets: [
          "the item keeps original condition and packaging",
          "you can provide the order number",
          "the product is not an exception (e.g. personalized items)",
        ],
      },
      {
        heading: "How to start",
        paragraphs: [
          "Use the form on this page with your order number, email and items to return.",
          "You can also email or message us on Telegram. After inspection we refund to the original payment method.",
        ],
      },
      {
        heading: "Defects or wrong item",
        paragraphs: [
          "If you received a defective or wrong item, replacement or refund is on us. Contact us within 48 hours of delivery.",
        ],
      },
    ],
  },
  ru: {
    lead: "Если товар не подошёл — верните его в течение 14 дней с момента получения.",
    sections: [
      {
        heading: "Условия возврата",
        paragraphs: ["Возврат возможен, если:"],
        bullets: [
          "сохранён товарный вид и комплектация",
          "есть номер заказа",
          "товар не входит в исключения (например, персонализированные позиции)",
        ],
      },
      {
        heading: "Как оформить",
        paragraphs: [
          "Заполните форму ниже на этой странице: номер заказа, email и товары для возврата.",
          "Также можно написать на email или в Telegram. После проверки вернём средства тем же способом оплаты.",
        ],
      },
      {
        heading: "Брак или ошибка отправки",
        paragraphs: [
          "При браке или неверном товаре — замена или возврат за наш счёт. Свяжитесь с нами в течение 48 часов после получения.",
        ],
      },
    ],
  },
};

const privacy: Record<AppLocale, InfoPageContent> = {
  uk: {
    lead: "Ми обробляємо персональні дані лише для виконання замовлень, підтримки клієнтів і покращення сервісу.",
    sections: [
      {
        heading: "Які дані збираємо",
        paragraphs: ["Під час замовлення та звернень ми можемо отримувати:"],
        bullets: ["імʼя та прізвище", "телефон і email", "адресу або відділення доставки", "історію замовлень і платежів"],
      },
      {
        heading: "Навіщо",
        paragraphs: [
          "Дані потрібні для оформлення доставки, оплати, зворотного звʼязку та аналітики магазину в знеособленому вигляді.",
        ],
      },
      {
        heading: "Зберігання і передача",
        paragraphs: [
          "Дані зберігаються стільки, скільки потрібно для виконання договорів і вимог законодавства.",
          "Передаємо перевізникам і платіжним провайдерам лише необхідний мінімум для виконання послуги.",
        ],
      },
      {
        heading: "Ваші права",
        paragraphs: [
          "Ви можете запитати доступ, виправлення або видалення даних — напишіть на hello@da-shop.ua.",
        ],
      },
    ],
  },
  en: {
    lead: "We process personal data only to fulfill orders, support customers and improve the shop.",
    sections: [
      {
        heading: "What we collect",
        paragraphs: ["When you order or contact us we may receive:"],
        bullets: ["first and last name", "phone and email", "shipping address or branch", "order and payment history"],
      },
      {
        heading: "Why",
        paragraphs: [
          "Data is used for shipping, payment, customer support and anonymized store analytics.",
        ],
      },
      {
        heading: "Storage and sharing",
        paragraphs: [
          "We keep data as long as needed for contracts and legal requirements.",
          "Carriers and payment providers receive only the minimum required to deliver the service.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: ["You may request access, correction or deletion — email hello@da-shop.ua."],
      },
    ],
  },
  ru: {
    lead: "Мы обрабатываем персональные данные только для выполнения заказов, поддержки клиентов и улучшения сервиса.",
    sections: [
      {
        heading: "Какие данные собираем",
        paragraphs: ["При заказе и обращениях можем получать:"],
        bullets: ["имя и фамилию", "телефон и email", "адрес или отделение доставки", "историю заказов и платежей"],
      },
      {
        heading: "Зачем",
        paragraphs: [
          "Данные нужны для доставки, оплаты, обратной связи и обезличенной аналитики магазина.",
        ],
      },
      {
        heading: "Хранение и передача",
        paragraphs: [
          "Данные храним столько, сколько нужно для договоров и требований закона.",
          "Перевозчикам и платёжным провайдерам передаём только необходимый минимум.",
        ],
      },
      {
        heading: "Ваши права",
        paragraphs: [
          "Вы можете запросить доступ, исправление или удаление данных — напишите на hello@da-shop.ua.",
        ],
      },
    ],
  },
};

const terms: Record<AppLocale, InfoPageContent> = {
  uk: {
    lead: "Користуючись сайтом D&A, ви погоджуєтесь із цими умовами використання.",
    sections: [
      {
        heading: "Загальні положення",
        paragraphs: [
          "Сайт надає можливість переглядати каталог і оформлювати замовлення. Окремі сервіси можуть змінюватися без попередження, якщо це не впливає на вже підтверджені замовлення.",
        ],
      },
      {
        heading: "Замовлення",
        paragraphs: [
          "Оформлення замовлення є офертою купівлі на умовах, зазначених у кошику та на сторінках доставки/оплати.",
          "Ми можемо відхилити замовлення при відсутності товару, підозрі на шахрайство або помилці ціни — з повним поверненням коштів.",
        ],
      },
      {
        heading: "Інтелектуальна власність",
        paragraphs: [
          "Контент сайту (тексти, фото, дизайн) належить D&A або правовласникам. Копіювання без дозволу заборонено.",
        ],
      },
    ],
  },
  en: {
    lead: "By using the D&A website you agree to these terms of use.",
    sections: [
      {
        heading: "General",
        paragraphs: [
          "The site lets you browse the catalog and place orders. Some services may change without notice unless it affects already confirmed orders.",
        ],
      },
      {
        heading: "Orders",
        paragraphs: [
          "Placing an order is an offer to buy under the cart and delivery/payment terms shown on the site.",
          "We may decline an order if stock is missing, fraud is suspected, or a pricing error occurred — with a full refund.",
        ],
      },
      {
        heading: "Intellectual property",
        paragraphs: [
          "Site content (copy, photos, design) belongs to D&A or rights holders. Copying without permission is prohibited.",
        ],
      },
    ],
  },
  ru: {
    lead: "Используя сайт D&A, вы соглашаетесь с этими условиями использования.",
    sections: [
      {
        heading: "Общие положения",
        paragraphs: [
          "Сайт позволяет просматривать каталог и оформлять заказы. Отдельные сервисы могут меняться без предупреждения, если это не влияет на уже подтверждённые заказы.",
        ],
      },
      {
        heading: "Заказы",
        paragraphs: [
          "Оформление заказа — оферта покупки на условиях корзины и страниц доставки/оплаты.",
          "Мы можем отклонить заказ при отсутствии товара, подозрении на мошенничество или ошибке цены — с полным возвратом средств.",
        ],
      },
      {
        heading: "Интеллектуальная собственность",
        paragraphs: [
          "Контент сайта (тексты, фото, дизайн) принадлежит D&A или правообладателям. Копирование без разрешения запрещено.",
        ],
      },
    ],
  },
};

const offer: Record<AppLocale, InfoPageContent> = {
  uk: {
    lead: "Ця публічна оферта регулює купівлю товарів у інтернет-магазині D&A.",
    sections: [
      {
        heading: "Предмет оферти",
        paragraphs: [
          "Продавець пропонує Покупцю товари, розміщені в каталозі, за вказаними цінами. Акцепт оферти відбувається під час підтвердження замовлення на сайті.",
        ],
      },
      {
        heading: "Ціна і оплата",
        paragraphs: [
          "Ціни вказані в гривнях і можуть змінюватися до моменту оформлення. Оплата здійснюється способами, доступними на сторінці checkout.",
        ],
      },
      {
        heading: "Доставка і ризики",
        paragraphs: [
          "Ризик випадкового пошкодження переходить до Покупця після передачі відправлення перевізнику, крім випадків прихованого браку виробника.",
        ],
      },
      {
        heading: "Повернення",
        paragraphs: [
          "Повернення та обмін регулюються сторінкою «Повернення» та чинним законодавством України про захист прав споживачів.",
        ],
      },
    ],
  },
  en: {
    lead: "This public offer governs purchases in the D&A online store.",
    sections: [
      {
        heading: "Subject",
        paragraphs: [
          "The seller offers products listed in the catalog at the stated prices. Accepting the offer happens when you confirm the order on the site.",
        ],
      },
      {
        heading: "Price and payment",
        paragraphs: [
          "Prices are shown in UAH and may change until checkout is completed. Payment uses the methods available on the checkout page.",
        ],
      },
      {
        heading: "Delivery and risk",
        paragraphs: [
          "Risk of accidental damage passes to the buyer after the parcel is handed to the carrier, except for latent manufacturing defects.",
        ],
      },
      {
        heading: "Returns",
        paragraphs: [
          "Returns and exchanges follow the Returns page and applicable Ukrainian consumer protection law.",
        ],
      },
    ],
  },
  ru: {
    lead: "Эта публичная оферта регулирует покупку товаров в интернет-магазине D&A.",
    sections: [
      {
        heading: "Предмет оферты",
        paragraphs: [
          "Продавец предлагает Покупателю товары из каталога по указанным ценам. Акцепт оферты происходит при подтверждении заказа на сайте.",
        ],
      },
      {
        heading: "Цена и оплата",
        paragraphs: [
          "Цены указаны в гривнах и могут меняться до момента оформления. Оплата — способами, доступными на странице checkout.",
        ],
      },
      {
        heading: "Доставка и риски",
        paragraphs: [
          "Риск случайного повреждения переходит к Покупателю после передачи отправления перевозчику, кроме случаев скрытого брака производителя.",
        ],
      },
      {
        heading: "Возврат",
        paragraphs: [
          "Возврат и обмен регулируются страницей «Возврат» и действующим законодательством Украины о защите прав потребителей.",
        ],
      },
    ],
  },
};

const faq: Record<AppLocale, FaqItem[]> = {
  uk: [
    {
      question: "Скільки коштує доставка?",
      answer:
        "Від 1500 ₴ — безкоштовно. Нижче порогу вартість рахується за тарифами Нової Пошти під час оформлення.",
    },
    {
      question: "Як швидко відправляєте?",
      answer: "Товари в наявності зазвичай їдуть протягом 1–2 робочих днів після підтвердження.",
    },
    {
      question: "Чи можна оплатити після отримання?",
      answer:
        "Ні. Працюємо лише з повною онлайн-оплатою до відправки. Накладеного платежу немає.",
    },
    {
      question: "Як відстежити замовлення?",
      answer: "Сторінка «Відстежити замовлення»: введіть номер замовлення і email з checkout.",
    },
    {
      question: "Товар оригінальний?",
      answer: "Так. Працюємо з перевіреними постачальниками і вказуємо бренд / тип автентичності в картці товару.",
    },
    {
      question: "Що з розмірами одягу?",
      answer: "Орієнтуйтесь на таблицю в описі. Якщо сумніваєтесь — напишіть у підтримку до покупки.",
    },
  ],
  en: [
    {
      question: "How much is shipping?",
      answer:
        "Free from 1500 ₴. Below that, Nova Poshta rates are calculated at checkout.",
    },
    {
      question: "How fast do you ship?",
      answer: "In-stock items usually leave within 1–2 business days after confirmation.",
    },
    {
      question: "Can I pay on delivery?",
      answer:
        "No. We only accept full prepaid online payment before shipping. Cash on delivery is not available.",
    },
    {
      question: "How do I track an order?",
      answer: "Use Track order: enter the order number and the email used at checkout.",
    },
    {
      question: "Are products authentic?",
      answer: "Yes. We work with verified suppliers and show brand / authenticity type on the product page.",
    },
    {
      question: "What about clothing sizes?",
      answer: "Check the size notes in the description. Unsure? Message support before buying.",
    },
  ],
  ru: [
    {
      question: "Сколько стоит доставка?",
      answer:
        "От 1500 ₴ — бесплатно. Ниже порога стоимость считается по тарифам Новой Почты при оформлении.",
    },
    {
      question: "Как быстро отправляете?",
      answer: "Товары в наличии обычно уходят в течение 1–2 рабочих дней после подтверждения.",
    },
    {
      question: "Можно оплатить при получении?",
      answer:
        "Нет. Работаем только с полной онлайн-оплатой до отправки. Наложенного платежа нет.",
    },
    {
      question: "Как отследить заказ?",
      answer: "Страница «Отследить заказ»: введите номер заказа и email с checkout.",
    },
    {
      question: "Товар оригинальный?",
      answer: "Да. Работаем с проверенными поставщиками и указываем бренд / тип аутентичности в карточке.",
    },
    {
      question: "Что с размерами одежды?",
      answer: "Сверяйтесь с описанием. Если сомневаетесь — напишите в поддержку до покупки.",
    },
  ],
};

export function getAboutContent(locale: string) {
  return about[resolveLocale(locale)];
}
export function getDeliveryContent(locale: string) {
  return delivery[resolveLocale(locale)];
}
export function getReturnsContent(locale: string) {
  return returns[resolveLocale(locale)];
}
export function getPrivacyContent(locale: string) {
  return privacy[resolveLocale(locale)];
}
export function getTermsContent(locale: string) {
  return terms[resolveLocale(locale)];
}
export function getOfferContent(locale: string) {
  return offer[resolveLocale(locale)];
}
export function getFaqItems(locale: string) {
  return faq[resolveLocale(locale)];
}

export const STORE_CONTACTS = {
  email: "hello@da-shop.ua",
  phone: "+380 00 000 00 00",
  telegram: "https://t.me/da_shop",
  instagram: "https://instagram.com/da.shop",
  hoursUk: "Пн–Сб · 10:00–19:00",
  hoursEn: "Mon–Sat · 10:00–19:00",
  hoursRu: "Пн–Сб · 10:00–19:00",
} as const;
