import React from "react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import FormatConverter from "@/components/utilities/FormatConverter";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ListOrdered, 
  FileText, 
  TableIcon, 
  Columns, 
  Sparkles, 
  Zap 
} from "lucide-react";

const FormatConverterPage: React.FC = () => {
  const features = [
    {
      icon: ListOrdered,
      title: "Text → List",
      description: "Tách text theo dấu phân cách thành danh sách"
    },
    {
      icon: FileText,
      title: "List → Text",
      description: "Gộp danh sách thành một dòng text"
    },
    {
      icon: TableIcon,
      title: "Text → CSV",
      description: "Chuyển đổi text sang định dạng CSV"
    },
    {
      icon: Columns,
      title: "CSV → Table",
      description: "Xem dữ liệu CSV dạng bảng trực quan"
    },
    {
      icon: Sparkles,
      title: "Chuẩn hoá",
      description: "Gộp dòng theo số cột, chuẩn hoá dữ liệu"
    },
    {
      icon: Zap,
      title: "Xử lý nhanh",
      description: "Trim, xoá trùng, đánh số, đổi chữ hoa/thường"
    }
  ];

  return (
    <Layout>
      <Helmet>
        <title>Bộ Chuyển Đổi Định Dạng | Format Converter</title>
        <meta name="description" content="Công cụ chuyển đổi định dạng dữ liệu: text to list, list to text, text to CSV, CSV preview, chuẩn hoá dữ liệu cho MMO" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Columns className="h-6 w-6 text-primary" />
            Bộ Chuyển Đổi Định Dạng
          </h1>
          <p className="text-muted-foreground">
            Chuyển đổi dữ liệu nhanh - Copy acc, copy list, chuẩn hoá dữ liệu import
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-dashed">
                <CardContent className="p-3 text-center">
                  <Icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <div className="font-medium text-sm">{feature.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{feature.description}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Converter */}
        <FormatConverter />
      </div>
    </Layout>
  );
};

export default FormatConverterPage;
