const ru = {
  title: 'НОК КР',
  subtitle: 'Задачи, чат и база знаний НОК',
  promoText:
    'Рабочее пространство сотрудников Национального Олимпийского Комитета Кыргызской Республики: задачи, переписка, база знаний и календарь в одном приложении.',
  description: `НОК КР — внутреннее приложение для сотрудников Национального Олимпийского Комитета Кыргызской Республики. Вход — только с рабочим аккаунтом Google домена olympic.kg; доступ выдаёт администратор НОК КР.

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

А также: уведомления о назначениях и сроках, отпуска с заместителем, фото профиля, светлая и тёмная тема, русский, кыргызский и английский языки.`,
  keywords: [
    'НОК',
    'олимпийский',
    'комитет',
    'задачи',
    'чат',
    'база знаний',
    'календарь',
    'сотрудники',
    'Кыргызстан',
    'olympic',
  ],
  supportUrl: 'https://dashboard.olympic.kg/privacy',
  privacyPolicyUrl: 'https://dashboard.olympic.kg/privacy',
};

const en = {
  title: 'НОК КР',
  subtitle: 'NOC KR staff workspace',
  promoText:
    'The workspace for staff of the National Olympic Committee of the Kyrgyz Republic: tasks, messaging, knowledge base and calendar in one app.',
  description: `NOC KR is the internal app for staff of the National Olympic Committee of the Kyrgyz Republic. Sign-in is available only with a work Google account in the olympic.kg domain; access is granted by the NOC KR administrator.

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

Also: notifications about assignments and deadlines, leave with a deputy, profile photo, light and dark theme, Russian, Kyrgyz and English.`,
  keywords: [
    'NOC',
    'olympic',
    'committee',
    'Kyrgyzstan',
    'tasks',
    'chat',
    'knowledge base',
    'calendar',
    'staff',
    'workspace',
  ],
  supportUrl: 'https://dashboard.olympic.kg/privacy',
  privacyPolicyUrl: 'https://dashboard.olympic.kg/privacy',
};

const reviewNotes = `NOC KR is an internal app for staff of the National Olympic Committee of the Kyrgyz Republic. It is not a consumer app: accounts are created by the organization's administrator and sign-in is limited to the organization's Google Workspace domain (olympic.kg).

The app opens in Russian. To switch to English, use the language selector (RU / KY / EN) in the top corner of the sign-in screen.

How to sign in:
1. Tap "Continue with Google" ("Продолжить с Google" in Russian) on the first screen.
2. Google's sign-in page opens. Enter the demo account and password provided in this form.
3. You return to the app signed in as a department employee.

What to try:
- Tasks tab: open the task "App Review — demo task", change its status and add a comment.
- Chat tab: open "Assistant" at the top and ask "What are my tasks this week?". Actions the assistant proposes (create a task, send a message, schedule a meeting) are executed only after tapping "Create".
- More → Knowledge base: open an article, tap "Graph" to see links between articles.
- More → Calendar: select a day, tap "New event".
- More → Profile: upload a profile photo, switch theme and language.

Sign in with Apple is not offered because the app exclusively uses the organization's own work accounts (Guideline 4.8 exception for company accounts). There is no in-app account creation; accounts are managed by the organization's administrator, so account deletion is handled by the administrator (contact info@olympic.kg), as described in the privacy policy at https://dashboard.olympic.kg/privacy.

The app will be distributed to staff only through an unlisted App Store link.`;

module.exports = {
  configVersion: 0,
  apple: {
    copyright: '2026 ОО «Национальный Олимпийский Комитет Кыргызской Республики»',
    categories: ['BUSINESS', 'PRODUCTIVITY'],
    info: { ru, 'en-US': en },
    review: {
      firstName: process.env.REVIEW_CONTACT_FIRST_NAME || '',
      lastName: process.env.REVIEW_CONTACT_LAST_NAME || '',
      email: process.env.REVIEW_CONTACT_EMAIL || '',
      phone: process.env.REVIEW_CONTACT_PHONE || '',
      demoUsername: 'appreview@olympic.kg',
      demoPassword: process.env.REVIEW_DEMO_PASSWORD || '',
      demoRequired: true,
      notes: reviewNotes,
    },
  },
};
