import "dotenv/config";
import {
  Role,
  OrderStatus,
  PaymentMethod,
  DriverType,
  CancelReason,
  DiscountStatus,
} from "@prisma/client";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🍣 Starting realistic dark kitchen dataset seeding...");

  // 1. Brands
  const brandsData = ["Flower", "Mastery", "Niwa", "Tobiko"];
  const brands: any[] = [];
  for (const name of brandsData) {
    const brand = await prisma.brand.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
    brands.push(brand);
  }

  // 2. Platforms
  const platformsData = ["Talabat", "elmenus", "InstaShop", "Harry App", "Facebook", "Phone"];
  const platforms: any[] = [];
  for (const name of platformsData) {
    const platform = await prisma.platform.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
    platforms.push(platform);
  }

  // 3. Staff Users
  const manager = await prisma.user.upsert({
    where: { email: "manager@sushiflower.local" },
    update: { name: "حسام الجيار (مدير التشغيل)", role: Role.MANAGER, isActive: true },
    create: {
      email: "manager@sushiflower.local",
      name: "حسام الجيار (مدير التشغيل)",
      role: Role.MANAGER,
      isActive: true,
    },
  });

  const cashiersData = [
    { email: "cashier1@sushiflower.local", name: "أحمد عبد الله (كاشير صباحي)" },
    { email: "cashier2@sushiflower.local", name: "مروان شريف (كاشير مسائي)" },
    { email: "cashier3@sushiflower.local", name: "نور الدين سامي (كاشير ويك إند)" },
  ];

  const cashiers: any[] = [];
  for (const c of cashiersData) {
    const cashier = await prisma.user.upsert({
      where: { email: c.email },
      update: { name: c.name, role: Role.CASHIER, isActive: true },
      create: { email: c.email, name: c.name, role: Role.CASHIER, isActive: true },
    });
    cashiers.push(cashier);
  }

  // 4. Delivery Drivers & Zones
  const zonesData = [
    { name: "المعادي ودجلة", fee: 30 },
    { name: "التجمع الخامس والقاهرة الجديدة", fee: 45 },
    { name: "مدينة نصر ومصر الجديدة", fee: 35 },
    { name: "الزمالك والمهندسين", fee: 35 },
  ];

  const zones: any[] = [];
  for (const z of zonesData) {
    let zone = await prisma.deliveryZone.findFirst({ where: { name: z.name } });
    if (!zone) {
      zone = await prisma.deliveryZone.create({
        data: { name: z.name, fee: z.fee, isActive: true },
      });
    }
    zones.push(zone);
  }

  const driversData = [
    { name: "كابتن محمود رضا" },
    { name: "كابتن إسلام بدر" },
    { name: "كابتن هاني سليم" },
  ];

  const drivers: any[] = [];
  for (const d of driversData) {
    let driver = await prisma.deliveryDriver.findFirst({ where: { name: d.name } });
    if (!driver) {
      driver = await prisma.deliveryDriver.create({
        data: { name: d.name, type: DriverType.APP, isActive: true },
      });
    }
    drivers.push(driver);
  }

  // 5. Customers
  const customersData = [
    { name: "كريم عادل", phone: "01012345678", address: "المعادي، شارع 9" },
    { name: "أحمد الشناوي", phone: "01198765432", address: "التجمع الخامس، النرجس" },
    { name: "سارة القاضي", phone: "01234567890", address: "الزمالك، شارع 26 يوليو" },
    { name: "محمد طارق", phone: "01556781234", address: "مدينة نصر، عباس العقاد" },
    { name: "نورهان هشام", phone: "01099887766", address: "مصر الجديدة، الكوربة" },
    { name: "يوسف خليل", phone: "01122334455", address: "المعادي، دجلة" },
    { name: "مريم فوزي", phone: "01288776655", address: "التجمع الأول" },
    { name: "عمر إبراهيم", phone: "01066554433", address: "المهندسين، جامعة الدول" },
  ];

  const customers: any[] = [];
  for (const c of customersData) {
    let customer = await prisma.customer.findUnique({ where: { phone: c.phone } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { name: c.name, phone: c.phone, address: c.address },
      });
    }
    customers.push(customer);
  }

  // 6. Products Catalog
  const categoriesData = [
    { name: "رول ومكي كلاسيك" },
    { name: "نيجيري وساشيمي" },
    { name: "كومبو ومجموعات" },
    { name: "مقبلات وسلطات" },
  ];

  const productsData = [
    { name: "كاليفورنيا رول (8 قطع)", price: 160, category: "رول ومكي كلاسيك" },
    { name: "فيلادلفيا سالمون رول (8 قطع)", price: 195, category: "رول ومكي كلاسيك" },
    { name: "كريسبي سالمون ماكي (6 قطع)", price: 185, category: "رول ومكي كلاسيك" },
    { name: "دراجون رول بالجمبري والأناناس (8 قطع)", price: 230, category: "رول ومكي كلاسيك" },
    { name: "سبايسي تونة رول (8 قطع)", price: 175, category: "رول ومكي كلاسيك" },
    { name: "كرانشي جمبري تمبورا (8 قطع)", price: 180, category: "رول ومكي كلاسيك" },
    { name: "ساشيمي سالمون بريميوم (4 قطع)", price: 190, category: "نيجيري وساشيمي" },
    { name: "نيجيري جمبري إيبي (3 قطع)", price: 130, category: "نيجيري وساشيمي" },
    { name: "نيجيري سالمون مدخن (3 قطع)", price: 145, category: "نيجيري وساشيمي" },
    { name: "كومبو السعادة 30 قطعة", price: 580, category: "كومبو ومجموعات" },
    { name: "بارتي بلاتر طوكيو 50 قطعة", price: 950, category: "كومبو ومجموعات" },
    { name: "كومبو فردي مكس 12 قطعة", price: 260, category: "كومبو ومجموعات" },
    { name: "سلطة كراب حارة كاني", price: 120, category: "مقبلات وسلطات" },
    { name: "إدمامي حار بالثوم والسمسم", price: 90, category: "مقبلات وسلطات" },
    { name: "شوربة ميسو يابانية بالواكامي", price: 65, category: "مقبلات وسلطات" },
  ];

  const brandProductsMap = new Map<string, any[]>();
  for (const brand of brands) {
    const list: any[] = [];
    for (const cat of categoriesData) {
      let category = await prisma.category.findFirst({
        where: { brandId: brand.id, name: cat.name },
      });
      if (!category) {
        category = await prisma.category.create({
          data: { brandId: brand.id, name: cat.name, sortOrder: 0 },
        });
      }

      for (const prod of productsData.filter((p) => p.category === cat.name)) {
        let product = await prisma.product.findFirst({
          where: { categoryId: category.id, name: prod.name },
        });
        if (!product) {
          product = await prisma.product.create({
            data: {
              categoryId: category.id,
              name: prod.name,
              price: prod.price,
              isActive: true,
            },
          });
        }
        list.push(product);
      }
    }
    brandProductsMap.set(brand.id, list);
  }

  // 7. Expense Types & Monthly Expenses
  const expenseTypesData = [
    { name: "خامات أسماك وسالمون طازج" },
    { name: "أرز سوشي وأعشاب نوري" },
    { name: "تعبئة وتغليف وبوكسات" },
    { name: "فواتير كهرباء ومياه وإنترنت" },
    { name: "صيانة أجهزة المطبخ" },
  ];

  const expenseTypes: any[] = [];
  for (const et of expenseTypesData) {
    let type = await prisma.expenseType.findFirst({ where: { name: et.name } });
    if (!type) {
      type = await prisma.expenseType.create({
        data: { name: et.name, isDefault: true, createdBy: manager.id },
      });
    }
    expenseTypes.push(type);
  }

  const now = new Date();
  // Insert 20 expenses spread across the month
  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 28);
    const expDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, 10, 0, 0);
    const type = expenseTypes[i % expenseTypes.length];
    const val = [650, 1200, 2400, 3100, 850, 1500][i % 6];
    await prisma.expense.create({
      data: {
        expenseTypeId: type.id,
        description: `توريد دوري: ${type.name}`,
        quantity: 1,
        value: val,
        date: expDate,
        createdBy: manager.id,
        createdAt: expDate,
      },
    });
  }

  // 8. Generate 130+ Orders across the past 30 days
  console.log("🍱 Generating 135 orders across 30 days with realistic peak hours...");
  const orderCountTarget = 135;
  const paymentMethods = [PaymentMethod.CASH, PaymentMethod.CASH, PaymentMethod.VISA, PaymentMethod.VISA, PaymentMethod.ONLINE];
  const peakHours = [13, 14, 15, 20, 21, 22, 23];
  const offPeakHours = [11, 12, 16, 17, 18, 19];

  for (let i = 0; i < orderCountTarget; i++) {
    let daysAgo = 0;
    const r = Math.random();
    if (r < 0.2) {
      daysAgo = 0; // Today
    } else if (r < 0.35) {
      daysAgo = 1; // Yesterday
    } else if (r < 0.65) {
      daysAgo = Math.floor(Math.random() * 6) + 2; // Last 7 days
    } else {
      daysAgo = Math.floor(Math.random() * 21) + 8; // Past 30 days
    }

    const isPeak = Math.random() < 0.75;
    const hour = isPeak
      ? peakHours[Math.floor(Math.random() * peakHours.length)]
      : offPeakHours[Math.floor(Math.random() * offPeakHours.length)];
    const minute = Math.floor(Math.random() * 59);

    const orderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, hour, minute, 0);

    const brand = brands[Math.floor(Math.random() * brands.length)];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const cashier = cashiers[Math.floor(Math.random() * cashiers.length)];
    const zone = zones[Math.floor(Math.random() * zones.length)];
    const driver = drivers[Math.floor(Math.random() * drivers.length)];

    let status: OrderStatus = OrderStatus.DELIVERED;
    let cancelReason: CancelReason | null = null;
    if (daysAgo === 0 && Math.random() < 0.25) {
      status = Math.random() < 0.5 ? OrderStatus.PREPARING : OrderStatus.READY;
    } else if (Math.random() < 0.1) {
      status = OrderStatus.CANCELLED;
      cancelReason = [
        CancelReason.CUSTOMER_CHANGED_MIND,
        CancelReason.DELIVERY_ISSUE,
        CancelReason.NO_ANSWER,
      ][Math.floor(Math.random() * 3)];
    }

    const brandProducts = brandProductsMap.get(brand.id) || [];
    const numItems = Math.floor(Math.random() * 3) + 1;
    let subtotal = 0;
    const orderItems: any[] = [];

    for (let k = 0; k < numItems; k++) {
      const prod = brandProducts[Math.floor(Math.random() * brandProducts.length)] || brandProducts[0];
      if (!prod) continue;
      const qty = Math.floor(Math.random() * 2) + 1;
      const itemTotal = Number(prod.price) * qty;
      subtotal += itemTotal;
      orderItems.push({
        productId: prod.id,
        quantity: qty,
        unitPrice: prod.price,
        totalPrice: itemTotal,
      });
    }

    let discount = 0;
    let discountStatus: DiscountStatus = DiscountStatus.NONE;
    let discountReason: string | null = null;
    let discountApprovedBy: string | null = null;

    if (Math.random() < 0.18) {
      discount = [25, 40, 50, 75][Math.floor(Math.random() * 4)];
      if (Math.random() < 0.85) {
        discountStatus = DiscountStatus.APPROVED;
        discountReason = ["عميل VIP دائم", "عرض السوشي الأسبوعي", "تعويض تأخير التوصيل"][Math.floor(Math.random() * 3)];
        discountApprovedBy = manager.id;
      } else {
        discountStatus = DiscountStatus.REJECTED;
        discountReason = "طلب خصم غير مطابق للشروط";
      }
    }

    const orderNumber = `SF-${orderTime.getFullYear()}${String(orderTime.getMonth() + 1).padStart(2, "0")}-${String(i + 3000).padStart(5, "0")}`;
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const deliveryFee = platform.name === "Phone" || platform.name === "Facebook" ? Number(zone.fee) : 0;

    await prisma.order.create({
      data: {
        orderNumber,
        externalId: platform.name !== "Phone" ? `EXT-${Math.floor(100000 + Math.random() * 900000)}` : null,
        brandId: brand.id,
        platformId: platform.id,
        customerId: customer.id,
        cashierId: cashier.id,
        zoneId: zone.id,
        driverId: status === OrderStatus.DELIVERED ? driver.id : null,
        status,
        cancelReason,
        subtotal,
        discount,
        deliveryFee,
        discountStatus,
        discountReason,
        discountApprovedBy,
        paymentMethod,
        createdAt: orderTime,
        confirmedAt: orderTime,
        preparingAt: new Date(orderTime.getTime() + 5 * 60000),
        readyAt: new Date(orderTime.getTime() + 20 * 60000),
        outForDeliveryAt: new Date(orderTime.getTime() + 25 * 60000),
        deliveredAt: status === OrderStatus.DELIVERED ? new Date(orderTime.getTime() + 50 * 60000) : null,
        cancelledAt: status === OrderStatus.CANCELLED ? new Date(orderTime.getTime() + 15 * 60000) : null,
        items: {
          create: orderItems,
        },
      },
    });
  }

  console.log("✅ Realistic dataset successfully seeded!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });
