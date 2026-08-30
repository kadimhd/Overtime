// Demo seed: launch categories (spec §4), retainer packages, the default
// contract template, and demo accounts with sample marketplace activity.
// Run with: npm run db:seed
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // --- Launch categories (spec §4) ---
  const categoriesData = [
    {
      slug: "accounting",
      nameAr: "المحاسبة والفواتير",
      nameEn: "Accounting & Invoicing",
      descAr: "دفاتر شهرية، إصدار ومتابعة فواتير، تقارير مالية بسيطة.",
      descEn: "Monthly bookkeeping, invoicing and follow-up, simple financial reports.",
      sortOrder: 0,
    },
    {
      slug: "virtual-assistance",
      nameAr: "المساعدة الافتراضية والإدارة",
      nameEn: "Virtual Assistance & Admin",
      descAr: "رد إيميلات، جدولة، إدخال بيانات، إدارة CRM.",
      descEn: "Email handling, scheduling, data entry, CRM management.",
      sortOrder: 1,
    },
    {
      slug: "marketing",
      nameAr: "التسويق الأساسي",
      nameEn: "Essential Marketing",
      descAr: "إدارة سوشيال ميديا، تصميم هوية بصرية، كتابة محتوى.",
      descEn: "Social media management, brand design, content writing.",
      sortOrder: 2,
    },
    // Phase 2 categories (spec §10: قانوني بسيط، تقني، ترجمة) — validated against
    // 2026 market research on Qatar startup service demand; excludes anything
    // requiring physical presence (company-formation/PRO government-office
    // runs, cleaning, etc.), consistent with spec §2's fully-remote rule.
    {
      slug: "legal",
      nameAr: "الاستشارات القانونية البسيطة",
      nameEn: "Simple Legal Consulting",
      descAr: "مراجعة عقود، استشارات قانونية أساسية، إرشادات امتثال — بدون تمثيل أمام المحاكم.",
      descEn: "Contract review, basic legal advice, compliance guidance — no court representation.",
      sortOrder: 3,
    },
    {
      slug: "tech",
      nameAr: "الدعم التقني وتطوير المواقع",
      nameEn: "Tech & Web Support",
      descAr: "بناء مواقع وتطبيقات بسيطة، دعم تقني عن بُعد، صيانة الأنظمة الرقمية.",
      descEn: "Websites and simple apps, remote IT support, digital systems maintenance.",
      sortOrder: 4,
    },
    {
      slug: "translation",
      nameAr: "الترجمة",
      nameEn: "Translation",
      descAr: "ترجمة مستندات ومحتوى بين العربية والإنجليزية.",
      descEn: "Document and content translation between Arabic and English.",
      sortOrder: 5,
    },
    {
      slug: "hr-recruitment",
      nameAr: "الموارد البشرية والتوظيف",
      nameEn: "HR & Recruitment",
      descAr: "فرز مرشحين وتوظيف عن بُعد، إعداد سياسات الموارد البشرية، إرشادات الرواتب (WPS).",
      descEn: "Remote candidate sourcing and screening, HR policy setup, payroll (WPS) guidance.",
      sortOrder: 6,
    },
    {
      slug: "business-consulting",
      nameAr: "استشارات الأعمال والتخطيط",
      nameEn: "Business & Strategy Consulting",
      descAr: "دراسات جدوى، خطط دخول السوق، استشارات نمو للشركات الصغيرة.",
      descEn: "Feasibility studies, market-entry plans, growth advisory for small businesses.",
      sortOrder: 7,
    },
  ];
  const categories = {};
  for (const data of categoriesData) {
    categories[data.slug] = await db.category.upsert({
      where: { slug: data.slug },
      create: data,
      update: data,
    });
  }

  // --- Retainer packages (spec §5-ج: أساسية / نمو / متكاملة) ---
  const packagesData = [
    {
      slug: "basic-accounting",
      categoryId: categories["accounting"].id,
      nameAr: "محاسب شهري",
      nameEn: "Monthly Accountant",
      descAr: "محاسب مخصص 5 ساعات شهرياً: دفاتر، فواتير، وتقرير شهري.",
      descEn: "A dedicated accountant, 5 hours/month: books, invoices, monthly report.",
      hoursPerMonth: 5,
      priceMonthly: 900,
      tier: "BASIC",
    },
    {
      slug: "growth-va",
      categoryId: categories["virtual-assistance"].id,
      nameAr: "مساعد نمو",
      nameEn: "Growth Assistant",
      descAr: "مساعد افتراضي 12 ساعة شهرياً + إدارة بريدك وجدولك.",
      descEn: "A virtual assistant, 12 hours/month, running your inbox and calendar.",
      hoursPerMonth: 12,
      priceMonthly: 1800,
      tier: "GROWTH",
    },
    {
      slug: "full-team",
      categoryId: null,
      nameAr: "الفريق المتكامل",
      nameEn: "Full Virtual Team",
      descAr: "محاسب + مساعد + مسوّق، 25 ساعة شهرياً موزعة حسب حاجتك.",
      descEn: "Accountant + assistant + marketer, 25 hours/month split as you need.",
      hoursPerMonth: 25,
      priceMonthly: 3900,
      tier: "FULL",
    },
  ];
  for (const data of packagesData) {
    await db.package.upsert({ where: { slug: data.slug }, create: data, update: data });
  }

  // --- Default contract template (spec §7: editable from admin, versioned per contract) ---
  const bodyAr = `عقد تقديم خدمة عن بُعد — منصة Overtime

التاريخ: {{date}}
الطرف الأول (صاحب العمل): {{client}}
الطرف الثاني (مزود الخدمة): {{provider}}

الموضوع: تنفيذ مهمة "{{task}}" عن بُعد بالكامل، خلال {{days}} يوماً، مقابل {{price}} ريال قطري.

1. يُحجز المبلغ لدى بوابة الدفع المرخّصة ويُحرَّر لمزود الخدمة بعد اعتماد التسليم.
2. التسليم رقمي بالكامل ولا يتضمن أي حضور فيزيائي.
3. يخضع هذا العقد لأحكام قانون العمل القطري رقم 9 لسنة 2026 ولوائحه التنفيذية فور صدورها.
4. تُحسم النزاعات عبر منصة Overtime أولاً قبل أي جهة أخرى.

(نموذج أولي — يُحدَّث من لوحة الإدارة فور صدور اللوائح التنفيذية.)`;

  const bodyEn = `Remote Service Agreement — Overtime Platform

Date: {{date}}
First party (Client): {{client}}
Second party (Provider): {{provider}}

Subject: fully remote delivery of the task "{{task}}" within {{days}} days for QAR {{price}}.

1. Funds are held at the licensed payment gateway and released to the provider upon delivery approval.
2. Delivery is fully digital; no physical presence is involved.
3. This agreement is subject to Qatar Labour Law No. 9 of 2026 and its executive regulations once issued.
4. Disputes are first resolved through the Overtime platform.

(Initial template — updated from the admin panel once executive regulations are issued.)`;

  const existingTemplate = await db.contractTemplate.findFirst({ where: { name: "default" } });
  if (!existingTemplate) {
    await db.contractTemplate.create({ data: { name: "default", bodyAr, bodyEn } });
  }

  // --- Demo accounts ---
  await db.user.upsert({
    where: { email: "admin@overtime.qa" },
    create: { role: "ADMIN", email: "admin@overtime.qa", name: "Overtime Admin" },
    update: {},
  });

  const client = await db.user.upsert({
    where: { phone: "+97455551234" },
    create: {
      role: "CLIENT",
      phone: "+97455551234",
      name: "نورة الكواري",
      businessType: "ecommerce",
      teamSize: "just_me",
      timeSink: "accounting",
    },
    update: {},
  });

  const providersData = [
    {
      phone: "+97455550001",
      name: "أحمد المهندي",
      headline: "محاسب معتمد — تقارير شهرية للشركات الصغيرة",
      bio: "عشر سنوات خبرة في محاسبة الشركات الصغيرة في قطر. أتعامل مع دفاتر شهرية وفواتير وتقارير ضريبية.",
      skills: "QuickBooks, Xero, فواتير, تقارير مالية",
      hourlyRate: 180,
      verified: true,
      cats: ["accounting"],
    },
    {
      phone: "+97455550002",
      name: "Sara Mahmoud",
      headline: "Virtual assistant — inbox zero & calendar sanity",
      bio: "Bilingual VA supporting founders in Doha. CRM, scheduling, data entry, travel.",
      skills: "Notion, HubSpot, Scheduling, Data entry",
      hourlyRate: 120,
      verified: true,
      cats: ["virtual-assistance"],
    },
    {
      phone: "+97455550003",
      name: "خالد العبيدلي",
      headline: "مسوّق محتوى — سوشيال ميديا وهوية بصرية",
      bio: "أدير حسابات سوشيال ميديا لمتاجر قطرية وأكتب محتوى عربي/إنجليزي.",
      skills: "Instagram, TikTok, Canva, كتابة محتوى",
      hourlyRate: 150,
      verified: false,
      cats: ["marketing"],
    },
  ];

  const providers = [];
  for (const data of providersData) {
    const user = await db.user.upsert({
      where: { phone: data.phone },
      create: {
        role: "PROVIDER",
        phone: data.phone,
        name: data.name,
        providerProfile: {
          create: {
            headline: data.headline,
            bio: data.bio,
            skills: data.skills,
            hourlyRate: data.hourlyRate,
            verified: data.verified,
          },
        },
      },
      update: {},
      include: { providerProfile: true },
    });
    for (const slug of data.cats) {
      await db.providerCategory.upsert({
        where: {
          providerId_categoryId: {
            providerId: user.providerProfile.id,
            categoryId: categories[slug].id,
          },
        },
        create: { providerId: user.providerProfile.id, categoryId: categories[slug].id },
        update: {},
      });
    }
    providers.push(user);
  }

  // Pending verification request for the unverified provider
  const khaled = providers[2];
  await db.verificationRequest.upsert({
    where: { providerId: khaled.providerProfile.id },
    create: {
      providerId: khaled.providerProfile.id,
      documents: "QID-28563412.pdf\nMarketing-Diploma.pdf",
    },
    update: {},
  });

  // --- Sample marketplace activity ---
  const openTaskCount = await db.task.count();
  if (openTaskCount === 0) {
    const inWeek = (weeks) => new Date(Date.now() + weeks * 7 * 24 * 3600 * 1000);

    // An open task with two competing offers (compare-offers screen)
    const task1 = await db.task.create({
      data: {
        clientId: client.id,
        categoryId: categories["accounting"].id,
        title: "إقفال دفاتر شهر أغسطس وإصدار الفواتير",
        description:
          "متجر إلكتروني صغير (~40 طلب شهرياً). المطلوب: تسجيل المعاملات، مطابقة الحساب البنكي، إصدار 10 فواتير للعملاء، وتقرير أرباح مبسط.",
        budget: 1200,
        deadline: inWeek(2),
      },
    });
    await db.offer.create({
      data: {
        taskId: task1.id,
        providerId: providers[0].id,
        price: 1100,
        days: 5,
        message: "أشتغل على نفس نوع المتاجر حالياً — أسلمك التقرير خلال 5 أيام مع مطابقة بنكية كاملة.",
      },
    });
    await db.offer.create({
      data: {
        taskId: task1.id,
        providerId: providers[1].id,
        price: 950,
        days: 7,
        message: "I can handle the bookkeeping and invoicing within a week.",
      },
    });

    // An open marketing task with no offers yet (provider browse screen)
    await db.task.create({
      data: {
        clientId: client.id,
        categoryId: categories["marketing"].id,
        title: "خطة محتوى شهرية لإنستغرام",
        description: "متجر عطور محلي — أحتاج 12 بوست شهرياً بالعربي والإنجليزي مع تصاميم بسيطة.",
        budget: 1500,
        deadline: inWeek(3),
      },
    });
  }

  console.log("Seed complete.");
  console.log("Demo logins (OTP is always 123456):");
  console.log("  Client:   +97455551234");
  console.log("  Provider: +97455550001 (verified) / +97455550003 (pending verification)");
  console.log("  Admin:    admin@overtime.qa");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
