import DashboardLayout from "@/src/components/DashboardLayout";
import { LayoutInterface } from "@/src/types/common";
import { FC } from "react";

const layout: FC<LayoutInterface> = ({ children }) => {
  return <DashboardLayout>{children}</DashboardLayout>;
};

export default layout;
