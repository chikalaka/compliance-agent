"use client";

import { useRef, useState } from "react";
import { SectionForm } from "@/components/section-form";
import { FieldWrapper, DynamicList, CheckboxGroup } from "@/components/form-fields";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface Product {
  id: string;
  name: string;
}

const ENTITY_TYPES = [
  { value: "llc", label: "LLC" },
  { value: "c-corp", label: "C-Corp" },
  { value: "s-corp", label: "S-Corp" },
  { value: "partnership", label: "Partnership" },
  { value: "sole-proprietorship", label: "Sole Proprietorship" },
  { value: "nonprofit", label: "Non-Profit" },
  { value: "other", label: "Other" },
];

const CUSTOMER_TYPES = [
  { id: "enterprise", label: "Enterprise" },
  { id: "smb", label: "SMB" },
  { id: "consumers", label: "Consumers" },
];

export default function CompanyProductPage() {
  const [legalName, setLegalName] = useState("");
  const [hqCountry, setHqCountry] = useState("");
  const [hqState, setHqState] = useState("");
  const [entityType, setEntityType] = useState("");
  const [reviewPeriodFrom, setReviewPeriodFrom] = useState("");
  const [reviewPeriodTo, setReviewPeriodTo] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [customerTypes, setCustomerTypes] = useState<string[]>([]);
  const [productDescriptionLocation, setProductDescriptionLocation] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productArchitecture, setProductArchitecture] = useState("");
  const [cloudArchitecture, setCloudArchitecture] = useState("");

  const getFormData = () => ({
    legalName,
    hqLocation: { country: hqCountry, state: hqState },
    entityType,
    reviewPeriod: { from: reviewPeriodFrom, to: reviewPeriodTo },
    productsInScope: products.map((p) => p.name).filter(Boolean),
    customerTypes,
    productDescriptionLocation,
    productDescription,
    productArchitecture,
    cloudArchitecture,
  });

  return (
    <SectionForm
      sectionId="company-product"
      title="Company & Product Details"
      description="Enter your company information, products in scope, and architecture details."
      getFormData={getFormData}
    >
      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Company Information
          </h3>

          <FieldWrapper label="Company Legal Name" htmlFor="legalName">
            <Input
              id="legalName"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="Acme Inc."
            />
          </FieldWrapper>

          <div className="grid grid-cols-2 gap-4">
            <FieldWrapper label="HQ Country" htmlFor="hqCountry">
              <Input
                id="hqCountry"
                value={hqCountry}
                onChange={(e) => setHqCountry(e.target.value)}
                placeholder="United States"
              />
            </FieldWrapper>

            <FieldWrapper label="HQ State/Region" htmlFor="hqState">
              <Input
                id="hqState"
                value={hqState}
                onChange={(e) => setHqState(e.target.value)}
                placeholder="Delaware"
              />
            </FieldWrapper>
          </div>

          <FieldWrapper label="Entity Type">
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger>
                <SelectValue placeholder="Select entity type" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Review Period
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <FieldWrapper label="From Date" htmlFor="reviewFrom">
              <Input
                id="reviewFrom"
                type="date"
                value={reviewPeriodFrom}
                onChange={(e) => setReviewPeriodFrom(e.target.value)}
              />
            </FieldWrapper>

            <FieldWrapper label="To Date" htmlFor="reviewTo">
              <Input
                id="reviewTo"
                type="date"
                value={reviewPeriodTo}
                onChange={(e) => setReviewPeriodTo(e.target.value)}
              />
            </FieldWrapper>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Products & Customers
          </h3>

          <FieldWrapper
            label="Products in Scope"
            description="List all products that are in scope for SOC 2"
          >
            <DynamicList
              items={products}
              onChange={setProducts}
              placeholder="Product name"
            />
          </FieldWrapper>

          <FieldWrapper
            label="Customer Types"
            description="Who are your primary customers?"
          >
            <CheckboxGroup
              options={CUSTOMER_TYPES}
              selected={customerTypes}
              onChange={setCustomerTypes}
            />
          </FieldWrapper>

          <FieldWrapper
            label="Product Description Location"
            description="Where can customers and employees see details about the product?"
            htmlFor="productLocation"
          >
            <Input
              id="productLocation"
              value={productDescriptionLocation}
              onChange={(e) => setProductDescriptionLocation(e.target.value)}
              placeholder="https://example.com/product or internal wiki link"
            />
          </FieldWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Descriptions & Architecture
          </h3>

          <FieldWrapper
            label="Product Description"
            description="Describe your product(s) in detail"
            htmlFor="productDesc"
          >
            <Textarea
              id="productDesc"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="Our product is a cloud-based platform that..."
              rows={5}
            />
          </FieldWrapper>

          <FieldWrapper
            label="Product Architecture"
            description="Describe the technical architecture of your product"
            htmlFor="productArch"
          >
            <Textarea
              id="productArch"
              value={productArchitecture}
              onChange={(e) => setProductArchitecture(e.target.value)}
              placeholder="The platform consists of a React frontend, Node.js backend..."
              rows={5}
            />
          </FieldWrapper>

          <FieldWrapper
            label="Cloud Architecture"
            description="Describe your cloud infrastructure setup"
            htmlFor="cloudArch"
          >
            <Textarea
              id="cloudArch"
              value={cloudArchitecture}
              onChange={(e) => setCloudArchitecture(e.target.value)}
              placeholder="We use AWS with the following services..."
              rows={5}
            />
          </FieldWrapper>
        </CardContent>
      </Card>
    </SectionForm>
  );
}

