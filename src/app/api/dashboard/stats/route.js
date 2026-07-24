import { product } from "@/models/product";
import { backOrders } from "@/models/Backorders";
import { mongooseConnect } from "@/lib/mongoose";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export const GET = withAuth(async (req, _context, session) => {
  try {
    await mongooseConnect();
    const sellerId = new mongoose.Types.ObjectId(session.user.id);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const twentyEightDaysAgo = new Date();
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 27);
    twentyEightDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalProducts,
      totalOrders,
      pendingOrders,
      revenueAgg,
      previousRevenueAgg,
      revenueByDayRaw,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      product.countDocuments({ sellerId }),
      backOrders.countDocuments({ sellerId }),
      backOrders.countDocuments({ sellerId, delivered: { $ne: true } }),
      backOrders.aggregate([
        { $match: { sellerId, paid: true } },
        { $group: { _id: null, total: { $sum: { $multiply: ["$price", "$quantity"] } } } },
      ]),
      backOrders.aggregate([
        {
          $match: {
            sellerId,
            paid: true,
            createdAt: { $gte: twentyEightDaysAgo, $lt: fourteenDaysAgo },
          },
        },
        { $group: { _id: null, total: { $sum: { $multiply: ["$price", "$quantity"] } } } },
      ]),
      backOrders.aggregate([
        { $match: { sellerId, paid: true, createdAt: { $gte: fourteenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: { $multiply: ["$price", "$quantity"] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      backOrders.find({ sellerId }).sort({ createdAt: -1 }).limit(10),
      product
        .find({ sellerId, stock: { $lt: 5 } })
        .select("productName stock")
        .limit(10),
    ]);

    return NextResponse.json(
      {
        totalProducts,
        totalOrders,
        pendingOrders,
        totalRevenue: revenueAgg[0]?.total || 0,
        previousPeriodRevenue: previousRevenueAgg[0]?.total || 0,
        revenueByDay: revenueByDayRaw.map((d) => ({ date: d._id, revenue: d.revenue })),
        recentOrders,
        lowStockProducts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ message: "Error fetching dashboard stats." }, { status: 500 });
  }
});
