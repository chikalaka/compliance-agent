"use client";

import { useState } from "react";
import { SectionForm } from "@/components/section-form";
import { FieldWrapper, CheckboxGroup } from "@/components/form-fields";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

interface Office {
  id: string;
  city: string;
  country: string;
  ownership: string;
}

const OFFICE_TYPE_OPTIONS = [
  { value: "remote-only", label: "Remote-only" },
  { value: "hybrid", label: "Hybrid" },
  { value: "in-person", label: "Fully in-person" },
];

const OWNERSHIP_OPTIONS = [
  { value: "owned", label: "Owned" },
  { value: "leased", label: "Leased" },
  { value: "coworking", label: "Coworking" },
];

const ACCESS_METHOD_OPTIONS = [
  { id: "key", label: "Key" },
  { id: "badge", label: "Badge / Key Card" },
  { id: "biometric", label: "Biometric" },
  { id: "front-desk", label: "Front Desk" },
  { id: "security-guard", label: "Security Guard" },
  { id: "pin-code", label: "PIN Code" },
];

export default function OfficesPage() {
  const [officeType, setOfficeType] = useState("");
  const [offices, setOffices] = useState<Office[]>([]);
  const [accessMethods, setAccessMethods] = useState<string[]>([]);
  const [visitorSignIn, setVisitorSignIn] = useState(false);
  const [visitorEscort, setVisitorEscort] = useState(false);
  const [serverRoomsPresent, setServerRoomsPresent] = useState(false);

  const addOffice = () => {
    setOffices([
      ...offices,
      { id: crypto.randomUUID(), city: "", country: "", ownership: "" },
    ]);
  };

  const removeOffice = (id: string) => {
    setOffices(offices.filter((o) => o.id !== id));
  };

  const updateOffice = (
    id: string,
    field: keyof Omit<Office, "id">,
    value: string
  ) => {
    setOffices(
      offices.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  };

  const getFormData = () => ({
    officeType,
    offices: offices
      .filter((o) => o.city || o.country)
      .map((o) => ({
        city: o.city,
        country: o.country,
        ownership: o.ownership,
      })),
    physicalAccessMethods: accessMethods,
    visitorProcess: {
      signInRequired: visitorSignIn,
      escortRequired: visitorEscort,
      serverRoomsPresent,
    },
  });

  return (
    <SectionForm
      sectionId="offices"
      title="Offices & Physical Security"
      description="Describe your office locations and physical security measures."
      getFormData={getFormData}
    >
      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Office Type
          </h3>

          <FieldWrapper label="Work Arrangement">
            <Select value={officeType} onValueChange={setOfficeType}>
              <SelectTrigger>
                <SelectValue placeholder="Select office type" />
              </SelectTrigger>
              <SelectContent>
                {OFFICE_TYPE_OPTIONS.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldWrapper>
        </CardContent>
      </Card>

      {officeType && officeType !== "remote-only" && (
        <>
          <Card>
            <CardContent className="pt-6 space-y-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Office Locations
              </h3>

              <div className="space-y-4">
                {offices.map((office) => (
                  <div
                    key={office.id}
                    className="flex items-start gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <div className="grid flex-1 gap-4 sm:grid-cols-3">
                      <Input
                        value={office.city}
                        onChange={(e) =>
                          updateOffice(office.id, "city", e.target.value)
                        }
                        placeholder="City"
                      />
                      <Input
                        value={office.country}
                        onChange={(e) =>
                          updateOffice(office.id, "country", e.target.value)
                        }
                        placeholder="Country"
                      />
                      <Select
                        value={office.ownership}
                        onValueChange={(value) =>
                          updateOffice(office.id, "ownership", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Ownership" />
                        </SelectTrigger>
                        <SelectContent>
                          {OWNERSHIP_OPTIONS.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOffice(office.id)}
                      className="shrink-0 text-zinc-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOffice}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Office
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Physical Access Methods
              </h3>

              <FieldWrapper
                label="Access Methods"
                description="How do employees access the office?"
              >
                <CheckboxGroup
                  options={ACCESS_METHOD_OPTIONS}
                  selected={accessMethods}
                  onChange={setAccessMethods}
                />
              </FieldWrapper>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Visitor Access Process
              </h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="signIn"
                    checked={visitorSignIn}
                    onCheckedChange={(checked) =>
                      setVisitorSignIn(checked === true)
                    }
                  />
                  <Label htmlFor="signIn" className="cursor-pointer">
                    Visitor sign-in is required
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="escort"
                    checked={visitorEscort}
                    onCheckedChange={(checked) =>
                      setVisitorEscort(checked === true)
                    }
                  />
                  <Label htmlFor="escort" className="cursor-pointer">
                    Visitor escort is required
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="serverRooms"
                    checked={serverRoomsPresent}
                    onCheckedChange={(checked) =>
                      setServerRoomsPresent(checked === true)
                    }
                  />
                  <Label htmlFor="serverRooms" className="cursor-pointer">
                    Server rooms are present on-premises
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {officeType === "remote-only" && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              As a remote-only organization, physical office security controls
              are not applicable. The focus should be on endpoint security,
              device management, and secure remote access policies.
            </p>
          </CardContent>
        </Card>
      )}
    </SectionForm>
  );
}

