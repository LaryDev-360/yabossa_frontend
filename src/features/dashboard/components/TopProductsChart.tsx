import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useMemo } from "react";
import { useTranslation } from "../../../i18n/I18nContext";
import type { DashboardTopProduct } from "../types";

interface TopProductsChartProps {
  products: DashboardTopProduct[];
  locale: string;
}

export default function TopProductsChart({ products, locale }: TopProductsChartProps) {
  const { t } = useTranslation();

  const { categories, revenues } = useMemo(() => {
    const top = products.slice(0, 8);
    return {
      categories: top.map((p) => p.product_name),
      revenues: top.map((p) => Number.parseFloat(p.revenue)),
    };
  }, [products]);

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 280,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "65%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: {
        formatter: (val) =>
          new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
            Number(val),
          ),
      },
    },
    yaxis: {
      labels: {
        maxWidth: 140,
        style: { fontSize: "12px" },
      },
    },
    grid: {
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    tooltip: {
      y: {
        formatter: (val) =>
          new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(val),
      },
    },
  };

  if (products.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        {t("dashboard.noTopProducts")}
      </p>
    );
  }

  return (
    <Chart
      options={options}
      series={[{ name: t("dashboard.revenue"), data: revenues }]}
      type="bar"
      height={280}
    />
  );
}
