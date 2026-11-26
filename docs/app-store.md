# НОК КР — тексты для App Store Connect

Тексты разделов 1–4 заполняются автоматически из `store.config.js` (EAS Metadata):

```sh
REVIEW_CONTACT_FIRST_NAME=… REVIEW_CONTACT_LAST_NAME=… REVIEW_CONTACT_EMAIL=… \
REVIEW_CONTACT_PHONE=+996… REVIEW_DEMO_PASSWORD='пароль appreview@olympic.kg' \
npx eas-cli metadata:push
```

Команда попросит войти Apple ID. Пароль ревью-аккаунта не хранится в репозитории — только в
переменной на время команды. Анкету App Privacy (раздел 5), скриншоты и выбор сборки заполняют
вручную. Если тексты поменялись — правьте `store.config.js` и этот файл вместе.

Приложение `kg.olympic.nok.dev`, версия 1.0.0. Ниже — что вставить в каждое поле App Store Connect.
Основной язык — русский, дополнительно — английский (его читает ревьюер Apple).

## 1. App Information

| Поле | Значение |
|---|---|
| Name | НОК КР |
| Subtitle (ru) | Задачи, чат и база знаний НОК |
| Subtitle (en) | NOC KR staff workspace |
| Primary Category | Business |
| Secondary Category | Productivity |
| Content Rights | Does not contain, show, or access third-party content |
| Age Rating | 4+ — на все вопросы анкеты ответ «None» / «No» |
| Privacy Policy URL | https://dashboard.olympic.kg/privacy |

## 2. Версия 1.0.0 — русский

**Promotional Text**

```
Рабочее пространство сотрудников Национального Олимпийского Комитета Кыргызской Республики: задачи, переписка, база знаний и календарь в одном приложении.
```

**Description**

```
НОК КР — внутреннее приложение для сотрудников Национального Олимпийского Комитета Кыргызской Республики. Вход — только с рабочим аккаунтом Google домена olympic.kg; доступ выдаёт администратор НОК КР.

Задачи
• Доска и список задач департамента, свои задачи, фильтры по проектам
• Сроки по производственному календарю КР, напоминания и эскалации
• Комментарии с файлами, история изменений, задачи из входящих писем

Чат
• Каналы департаментов, личные переписки и группы
• Упоминания, файлы, ссылки на задачи и статьи
• ИИ-ассистент: отвечает по базе знаний, задачам и календарю и готовит задачи, сообщения и встречи — выполняются они только после вашего подтверждения

База знаний
• Статьи по разделам с поиском и связями между статьями
• Граф связей, история версий, просмотр файлов

Календарь
• Сроки задач, отпуска и командировки сотрудников, события и встречи
• Синхронизация с Google Календарём

А также: уведомления о назначениях и сроках, отпуска с заместителем, фото профиля, светлая и тёмная тема, русский, кыргызский и английский языки.
```

**Keywords** (не больше 100 символов)

```
НОК,олимпийский,комитет,задачи,чат,база знаний,календарь,сотрудники,Кыргызстан,olympic
```

**Support URL**

```
https://dashboard.olympic.kg/privacy
```

> На этой странице есть контакты (раздел 11). Если у НОК КР есть своя страница поддержки или
> сайт с контактами — лучше указать её.

**Marketing URL** — пусто.

**Copyright**

```
2026 ОО «Национальный Олимпийский Комитет Кыргызской Республики»
```

**What's New** — для первой версии поле не нужно.

## 3. Версия 1.0.0 — English

**Promotional Text**

```
The workspace for staff of the National Olympic Committee of the Kyrgyz Republic: tasks, messaging, knowledge base and calendar in one app.
```

**Description**

```
NOC KR is the internal app for staff of the National Olympic Committee of the Kyrgyz Republic. Sign-in is available only with a work Google account in the olympic.kg domain; access is granted by the NOC KR administrator.

Tasks
• Department board and list, my tasks, project filters
• Deadlines on the Kyrgyz working calendar, reminders and escalations
• Comments with files, change history, tasks created from incoming email

Chat
• Department channels, direct messages and groups
• Mentions, files, links to tasks and articles
• AI assistant: answers from the knowledge base, tasks and calendar, and drafts tasks, messages and meetings — they are carried out only after you confirm

Knowledge base
• Articles by section with search and links between articles
• Link graph, version history, file preview

Calendar
• Task deadlines, staff leave and business trips, events and meetings
• Google Calendar sync

Also: notifications about assignments and deadlines, leave with a deputy, profile photo, light and dark theme, Russian, Kyrgyz and English.
```

**Keywords**

```
NOC,olympic,committee,Kyrgyzstan,tasks,chat,knowledge base,calendar,staff,workspace
```

## 4. App Review Information

| Поле | Значение |
|---|---|
| Sign-in required | ✔ |
| User name | appreview@olympic.kg |
| Password | пароль аккаунта (2FA выключена) |
| Contact — First/Last name, Phone, Email | контакт исполнителя, который отвечает Apple |

**Notes** (на английском — ревьюер читает их)

```
NOC KR is an internal app for staff of the National Olympic Committee of the Kyrgyz Republic. It is not a consumer app: accounts are created by the organization's administrator and sign-in is limited to the organization's Google Workspace domain (olympic.kg).

The app opens in Russian. To switch to English, use the language selector (RU / KY / EN) in the top corner of the sign-in screen.

How to sign in:
1. Tap "Continue with Google" ("Продолжить с Google" in Russian) on the first screen.
2. Google's sign-in page opens. Enter the demo account appreview@olympic.kg and the password above.
3. You return to the app signed in as a department employee.

What to try:
- Tasks tab: open the task "App Review — demo task", change its status and add a comment.
- Chat tab: open "Assistant" at the top and ask "What are my tasks this week?". Actions the assistant proposes (create a task, send a message, schedule a meeting) are executed only after tapping "Create".
- More → Knowledge base: open an article, tap "Graph" to see links between articles.
- More → Calendar: select a day, tap "New event".
- More → Profile: upload a profile photo, switch theme and language.

Sign in with Apple is not offered because the app exclusively uses the organization's own work accounts (Guideline 4.8 exception for company accounts). There is no in-app account creation; accounts are managed by the organization's administrator, so account deletion is handled by the administrator (contact info@olympic.kg), as described in the privacy policy.

The app will be distributed to staff only through an unlisted App Store link.
```

## 5. App Privacy — анкета «Data Types»

**Do you or your third-party partners collect data from this app?** — Yes.

Для каждого типа ниже: **Used for:** App Functionality; **Linked to the user's identity:** Yes;
**Used for tracking:** No.

| Категория Apple | Тип | Что это у нас |
|---|---|---|
| Contact Info | Name | ФИО сотрудника |
| Contact Info | Email Address | рабочая почта |
| User Content | Photos or Videos | фото профиля, фото во вложениях |
| User Content | Emails or Text Messages | сообщения чата, письма из рабочего ящика |
| User Content | Other User Content | задачи, комментарии, статьи, файлы, события |
| Identifiers | User ID | ID сотрудника в платформе |
| Usage Data | Product Interaction | журнал действий (кто, что и когда сделал) |

Не собираем: Location, Health, Financial Info, Contacts, Browsing/Search History, Purchases,
Diagnostics, Sensitive Info. Рекламы и отслеживания (ATT) нет.

## 6. Export Compliance

Уже указано в сборке (`usesNonExemptEncryption: false`): приложение использует только стандартное
шифрование HTTPS. В App Store Connect вопрос не появится.

## 7. Заявка на Unlisted App Distribution

Подаётся на https://developer.apple.com/contact/request/unlisted-app/ (вход тем же Apple ID, что в
App Store Connect). Можно подать до или после одобрения ревью.

| Поле | Значение |
|---|---|
| App Name | НОК КР |
| Apple ID приложения | 6834389664 |
| Who is the app for | Employees of the National Olympic Committee of the Kyrgyz Republic |

**Description of intended audience and use**

```
NOC KR is the internal workspace app of the National Olympic Committee of the Kyrgyz Republic (a public association). It is used only by the organization's staff (about 15 people) and invited partners: tasks, internal messaging, a knowledge base and a calendar. Sign-in is restricted to the organization's Google Workspace domain (olympic.kg), and accounts are created by the organization's administrator, so the app is of no use to the general public. We would like to share it with staff through a direct link instead of making it searchable on the App Store.
```

## 8. Скриншоты

Нужны для iPhone 6.9" (1320 × 2868) — остальные размеры App Store сделает из них сам. От 3 до 10
штук, снимать с аккаунта `appreview@olympic.kg`, без реальных персональных данных. Порядок:

1. Задачи — доска или список
2. Карточка задачи
3. Чат — ассистент с ответом и карточкой действия
4. База знаний — статья
5. Календарь — день с событиями
6. Профиль (тёмная тема)
