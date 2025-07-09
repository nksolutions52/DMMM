import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import MainLayout from "../components/layout/MainLayout";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import FileUpload from "../components/ui/FileUpload";
import { Accordion, AccordionItem } from "../components/ui/Accordion";
import { useApi, useApiMutation } from "../hooks/useApi";
import { vehiclesAPI } from "../services/api";

const initialState = {
  aadharNumber: "",
  mobileNumber: "",
  registeredOwnerName: "",
  registrationNumber: "",
  guardianInfo: "",
  dateOfRegistration: "",
  address: "",
  registrationValidUpto: "",
  taxUpto: "",
  insuranceUpto: "",
  fcValidUpto: "",
  hypothecatedTo: "",
  permitUpto: "",
  chassisNumber: "",
  bodyType: "",
  engineNumber: "",
  colour: "",
  vehicleClass: "",
  fuelUsed: "",
  makersName: "",
  cubicCapacity: "",
  makersClassification: "",
  seatingCapacity: "",
  monthYearOfManufacture: "",
  ulw: "",
  gvw: "",
  subject: "",
  registeringAuthority: "",
  pucNumber: "",
  pucDate: "",
  pucTenure: "",
  pucFrom: "",
  pucTo: "",
  pucContactNo: "",
  pucAddress: "",
  insuranceCompanyName: "",
  insuranceType: "",
  policyNumber: "",
  insuranceDate: "",
  insuranceTenure: "",
  insuranceFrom: "",
  insuranceTo: "",
  insuranceContactNo: "",
  insuranceAddress: "",
  type: "Non Transport",
  // FITNESS
  fcNumber: "",
  fcTenureFrom: "",
  fcTenureTo: "",
  fcContactNo: "",
  fcAddress: "",
  // PERMIT
  permitNumber: "",
  permitTenureFrom: "",
  permitTenureTo: "",
  permitContactNo: "",
  permitAddress: "",
  // TAX
  taxNumber: "",
  taxTenureFrom: "",
  taxTenureTo: "",
  taxContactNo: "",
  taxAddress: "",
  isHPA: false,
};

const vehicleTypes = [
  { value: 'Transport', label: 'Transport' },
  { value: 'Non Transport', label: 'Non Transport' }
];

// Helper to convert ISO date string to yyyy-MM-dd for input[type=date]
function toDateInputValue(dateString: string | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  // Adjust for timezone offset so the date is not shifted
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localISO = new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
  return localISO;
}

// Add a type for vehicle with index signature
interface Vehicle {
  [key: string]: any;
  documents?: {
    [key: string]: Array<{
      id: string;
      original_name: string;
      file_size: number;
      mime_type: string;
      created_at: string;
    }>;
  };
}

const VehicleForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [activeTab, setActiveTab] = useState("personal");
  const [form, setForm] = useState(initialState);
  const [documentFiles, setDocumentFiles] = useState<{[key: string]: FileList | null}>({
    puc_documents: null,
    insurance_documents: null,
    fitness_documents: null,
    permit_documents: null,
    tax_documents: null
  });

  // Only fetch vehicle data if we have an ID (editing mode)
  const { data: vehicle, loading, error, refetch } = useApi(
    () => id ? vehiclesAPI.getById(id) : Promise.resolve(null),
    [id],
    !id // Skip API call if no ID
  ) as { data: Vehicle | null, loading: boolean, error: any, refetch: () => void };

  const { mutate: saveVehicle, loading: saving } = useApiMutation();
  const { mutate: deleteDocument } = useApiMutation();

  useEffect(() => {
    if (vehicle && id) {
      setForm(prev => ({
        ...prev,
        aadharNumber: vehicle.aadhar_number || "",
        mobileNumber: vehicle.mobile_number || "",
        registeredOwnerName: vehicle.registered_owner_name || "",
        registrationNumber: vehicle.registration_number || "",
        guardianInfo: vehicle.guardian_info || "",
        dateOfRegistration: toDateInputValue(vehicle.date_of_registration),
        address: vehicle.address || "",
        registrationValidUpto: toDateInputValue(vehicle.registration_valid_upto),
        taxUpto: toDateInputValue(vehicle.tax_tenure_to),
        insuranceUpto: toDateInputValue(vehicle.insurance_to),
        fcValidUpto: toDateInputValue(vehicle.fc_tenure_to),
        hypothecatedTo: vehicle.hypothicated_to || "",
        permitUpto: toDateInputValue(vehicle.permit_tenure_to),
        chassisNumber: vehicle.chassis_number || "",
        bodyType: vehicle.body_type || "",
        engineNumber: vehicle.engine_number || "",
        colour: vehicle.colour || "",
        vehicleClass: vehicle.vehicle_class || "",
        fuelUsed: vehicle.fuel_used || "",
        makersName: vehicle.makers_name || "",
        cubicCapacity: vehicle.cubic_capacity || "",
        makersClassification: vehicle.makers_classification || "",
        seatingCapacity: vehicle.seating_capacity || "",
        monthYearOfManufacture: vehicle.month_year_of_manufacture || "",
        ulw: vehicle.ulw || "",
        gvw: vehicle.gvw || "",
        subject: vehicle.subject || "",
        registeringAuthority: vehicle.registering_authority || "",
        pucNumber: vehicle.puc_number || "",
        pucDate: toDateInputValue(vehicle.puc_date),
        pucTenure: vehicle.puc_tenure || "",
        pucFrom: toDateInputValue(vehicle.puc_from),
        pucTo: toDateInputValue(vehicle.puc_to),
        pucContactNo: vehicle.puc_contact_no || "",
        pucAddress: vehicle.puc_address || "",
        insuranceCompanyName: vehicle.insurance_company_name || "",
        insuranceType: vehicle.insurance_type || "",
        policyNumber: vehicle.policy_number || "",
        insuranceDate: toDateInputValue(vehicle.insurance_date),
        insuranceTenure: vehicle.insurance_tenure || "",
        insuranceFrom: toDateInputValue(vehicle.insurance_from),
        insuranceTo: toDateInputValue(vehicle.insurance_to),
        insuranceContactNo: vehicle.insurance_contact_no || "",
        insuranceAddress: vehicle.insurance_address || "",
        type: vehicle.type || "Non Transport",
        fcNumber: vehicle.fc_number || "",
        fcTenureFrom: toDateInputValue(vehicle.fc_tenure_from),
        fcTenureTo: toDateInputValue(vehicle.fc_tenure_to),
        fcContactNo: vehicle.fc_contact_no || "",
        fcAddress: vehicle.fc_address || "",
        permitNumber: vehicle.permit_number || "",
        permitTenureFrom: toDateInputValue(vehicle.permit_tenure_from),
        permitTenureTo: toDateInputValue(vehicle.permit_tenure_to),
        permitContactNo: vehicle.permit_contact_no || "",
        permitAddress: vehicle.permit_address || "",
        taxNumber: vehicle.tax_number || "",
        taxTenureFrom: toDateInputValue(vehicle.tax_tenure_from),
        taxTenureTo: toDateInputValue(vehicle.tax_tenure_to),
        taxContactNo: vehicle.tax_contact_no || "",
        taxAddress: vehicle.tax_address || "",
        isHPA: !!vehicle.is_hpa,
      }));
    }
  }, [vehicle, id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (documentType: string, files: FileList | null) => {
    setDocumentFiles(prev => ({
      ...prev,
      [documentType]: files
    }));
  };

  const handleDeleteExistingDocument = async (fileId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument(() => vehiclesAPI.deleteDocument(fileId));
        // Refresh vehicle data to update the documents list
        if (refetch) {
          refetch();
        }
        alert('Document deleted successfully!');
      } catch (error) {
        console.error('Delete document failed:', error);
        alert('Failed to delete document. Please try again.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add all form fields
      Object.entries(form).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          formData.append(key, value ? 'true' : 'false');
        } else {
          formData.append(key, value || '');
        }
      });

      // Add vehicle ID for updates
      if (id) {
        formData.append('vehicleId', id);
      }

      // Add document files
      Object.entries(documentFiles).forEach(([documentType, files]) => {
        if (files) {
          Array.from(files).forEach(file => {
            formData.append(documentType, file);
          });
        }
      });

      let result;
      if (id) {
        result = await saveVehicle(() => vehiclesAPI.update(id, formData));
      } else {
        result = await saveVehicle(() => vehiclesAPI.create(formData));
      }

      if (result.success) {
        alert(id ? 'Vehicle updated successfully!' : 'Vehicle registered successfully!');
        navigate("/vehicles");
      } else {
        throw new Error(result.message || 'Failed to save vehicle');
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert(`Failed to save vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Show loading only when editing and fetching data
  if (loading && id) {
    return (
      <MainLayout>
        <LoadingSpinner size="lg" text="Loading vehicle data..." className="h-64" />
      </MainLayout>
    );
  }

  // Show error only when editing and there's an error
  if (error && id) {
    return (
      <MainLayout>
        <ErrorMessage message={`Error loading vehicle: ${error}`} />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex items-center mb-6 mt-3">
        <button
          onClick={() => navigate("/vehicles")}
          className="mr-3 p-1 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            <button
              className={`px-4 sm:px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === "personal"
                  ? "border-blue-700 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("personal")}
            >
              Personal Details
            </button>
            <button
              className={`px-4 sm:px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === "vehicle"
                  ? "border-blue-700 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("vehicle")}
            >
              Vehicle Details
            </button>
            <button
              className={`px-4 sm:px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === "documents"
                  ? "border-blue-700 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("documents")}
            >
              Documents & Other Details
            </button>
          </nav>
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === "personal" && (
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Personal & Registration Information
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Input
                  label="AADHAR NUMBER"
                  name="aadharNumber"
                  type="text"
                  placeholder="1234 5678 9012"
                  fullWidth
                  value={form.aadharNumber}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="MOBILE NUMBER"
                  name="mobileNumber"
                  type="text"
                  placeholder="9876543210"
                  fullWidth
                  value={form.mobileNumber}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="REGISTERED OWNER NAME"
                  name="registeredOwnerName"
                  type="text"
                  placeholder="Full name as per records"
                  fullWidth
                  value={form.registeredOwnerName}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="REGISTRATION NUMBER"
                  name="registrationNumber"
                  type="text"
                  placeholder="e.g. KA01MJ2022"
                  fullWidth
                  value={form.registrationNumber}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="D/o or S/o or W/o"
                  name="guardianInfo"
                  type="text"
                  placeholder="Guardian information"
                  fullWidth
                  value={form.guardianInfo}
                  onChange={handleChange}
                />
                <Input
                  label="DATE OF REGISTRATION"
                  name="dateOfRegistration"
                  type="date"
                  fullWidth
                  value={form.dateOfRegistration}
                  onChange={handleChange}
                  required
                />
                <div className="lg:col-span-2">
                  <Input
                    label="ADDRESS"
                    name="address"
                    type="text"
                    placeholder="Complete address"
                    fullWidth
                    value={form.address}
                    onChange={handleChange}
                    required
                  />
                </div>
                <Input
                  label="REGISTRATION VALID UPTO"
                  name="registrationValidUpto"
                  type="date"
                  fullWidth
                  value={form.registrationValidUpto}
                  onChange={handleChange}
                />
                <Input
                  label="TAX UPTO"
                  name="taxUpto"
                  type="date"
                  fullWidth
                  value={form.taxUpto}
                  onChange={handleChange}
                />
                <Input
                  label="INSURANCE UPTO"
                  name="insuranceUpto"
                  type="date"
                  fullWidth
                  value={form.insuranceUpto}
                  onChange={handleChange}
                />
                {/* <Input
                  label="FC VALID UPTO"
                  name="fcValidUpto"
                  type="date"
                  fullWidth
                  value={form.fcValidUpto}
                  onChange={handleChange}
                /> */}
                <div className="flex items-center col-span-2">
                  <input
                    type="checkbox"
                    id="isHPA"
                    name="isHPA"
                    checked={form.isHPA}
                    onChange={e => setForm({ ...form, isHPA: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="isHPA" className="text-sm font-medium text-gray-700">HPA (Hypothecation)</label>
                </div>
                {form.isHPA && (
                  <Input
                    label="HYPOTHECATED TO"
                    name="hypothecatedTo"
                    type="text"
                    placeholder="Bank or financial institution name"
                    fullWidth
                    value={form.hypothecatedTo}
                    onChange={handleChange}
                    required={form.isHPA}
                  />
                )}
                {/* <Input
                  label="PERMIT UPTO"
                  name="permitUpto"
                  type="date"
                  fullWidth
                  value={form.permitUpto}
                  onChange={handleChange}
                /> */}
              </div>
            </div>
          )}

          {activeTab === "vehicle" && (
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Vehicle Detailed Description
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Type Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    TYPE
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Type</option>
                    {vehicleTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="CHASSIS NUMBER"
                  name="chassisNumber"
                  type="text"
                  placeholder="e.g. MBLHA10ATCGJ12345"
                  fullWidth
                  value={form.chassisNumber}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="BODY TYPE"
                  name="bodyType"
                  type="text"
                  placeholder="e.g. Saloon, SUV, etc."
                  fullWidth
                  value={form.bodyType}
                  onChange={handleChange}
                />
                <Input
                  label="ENGINE NUMBER"
                  name="engineNumber"
                  type="text"
                  placeholder="e.g. HA10ENCGJ12345"
                  fullWidth
                  value={form.engineNumber}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="COLOUR"
                  name="colour"
                  type="text"
                  placeholder="e.g. White, Black, etc."
                  fullWidth
                  value={form.colour}
                  onChange={handleChange}
                />
                <Input
                  label="VEHICLE CLASS"
                  name="vehicleClass"
                  type="text"
                  placeholder="e.g. Motor Car, LMV, etc."
                  fullWidth
                  value={form.vehicleClass}
                  onChange={handleChange}
                />
                <Input
                  label="FUEL USED"
                  name="fuelUsed"
                  type="text"
                  placeholder="e.g. Petrol, Diesel, CNG, etc."
                  fullWidth
                  value={form.fuelUsed}
                  onChange={handleChange}
                />
                <Input
                  label="MAKER'S NAME"
                  name="makersName"
                  type="text"
                  placeholder="e.g. Maruti Suzuki, Hyundai, etc."
                  fullWidth
                  value={form.makersName}
                  onChange={handleChange}
                />
                <Input
                  label="CUBIC CAPACITY"
                  name="cubicCapacity"
                  type="text"
                  placeholder="e.g. 1197"
                  fullWidth
                  value={form.cubicCapacity}
                  onChange={handleChange}
                />
                <Input
                  label="MAKER'S CLASSIFICATION"
                  name="makersClassification"
                  type="text"
                  placeholder="e.g. Swift, Creta, etc."
                  fullWidth
                  value={form.makersClassification}
                  onChange={handleChange}
                />
                <Input
                  label="SEATING CAPACITY"
                  name="seatingCapacity"
                  type="text"
                  placeholder="e.g. 5"
                  fullWidth
                  value={form.seatingCapacity}
                  onChange={handleChange}
                />
                <Input
                  label="MONTH AND YEAR OF MFG."
                  name="monthYearOfManufacture"
                  type="text"
                  placeholder="e.g. 04/2022"
                  fullWidth
                  value={form.monthYearOfManufacture}
                  onChange={handleChange}
                />
                <Input
                  label="ULW (Unladen Weight)"
                  name="ulw"
                  type="text"
                  placeholder="e.g. 920"
                  fullWidth
                  value={form.ulw}
                  onChange={handleChange}
                />
                <Input
                  label="GVW (Gross Vehicle Weight)"
                  name="gvw"
                  type="text"
                  placeholder="e.g. 1415"
                  fullWidth
                  value={form.gvw}
                  onChange={handleChange}
                />
                {/* <Input
                  label="SUBJECT"
                  name="subject"
                  type="text"
                  placeholder="e.g. New Registration"
                  fullWidth
                  value={form.subject}
                  onChange={handleChange}
                /> */}
                <Input
                  label="REGISTERING AUTHORITY"
                  name="registeringAuthority"
                  type="text"
                  placeholder="e.g. RTO Bangalore Central"
                  fullWidth
                  value={form.registeringAuthority}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="p-4 sm:p-6">
              <Accordion allowMultiple>
                {/* PUC */}
                {(form.type === "Non Transport" || form.type === "Transport") && (
                  <AccordionItem key="puc" title="PUC Particulars">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                      <Input
                        label="PUC NUMBER"
                        name="pucNumber"
                        type="text"
                        placeholder="Enter PUC Number"
                        fullWidth
                        value={form.pucNumber}
                        onChange={handleChange}
                      />
                      {/* <Input
                        label="PUC DATE"
                        name="pucDate"
                        type="date"
                        fullWidth
                        value={form.pucDate}
                        onChange={handleChange}
                      /> */}
                      <Input
                        label="PUC VALID FROM"
                        name="pucFrom"
                        type="date"
                        fullWidth
                        value={form.pucFrom}
                        onChange={handleChange}
                      />
                      <Input
                        label="PUC VALID TO"
                        name="pucTo"
                        type="date"
                        fullWidth
                        value={form.pucTo}
                        onChange={handleChange}
                      />
                      <Input
                        label="PUC CONTACT NO."
                        name="pucContactNo"
                        type="text"
                        placeholder="e.g. 9876543211"
                        fullWidth
                        value={form.pucContactNo}
                        onChange={handleChange}
                      />
                      <div className="lg:col-span-2">
                        <Input
                          label="PUC ADDRESS"
                          name="pucAddress"
                          type="text"
                          placeholder="PUC center address"
                          fullWidth
                          value={form.pucAddress}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <FileUpload
                      label="PUC Documents"
                      name="puc_documents"
                      existingFiles={vehicle?.documents?.puc || []}
                      onFilesChange={(files) => handleFileChange('puc_documents', files)}
                      onDeleteExisting={handleDeleteExistingDocument}
                    />
                  </AccordionItem>
                )}
                
                {/* Insurance */}
                {(form.type === "Non Transport" || form.type === "Transport") && (
                  <AccordionItem key="insurance" title="Insurance Details">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                      <Input
                        label="INSURANCE COMPANY NAME"
                        name="insuranceCompanyName"
                        type="text"
                        placeholder="e.g. ICICI Lombard"
                        fullWidth
                        value={form.insuranceCompanyName}
                        onChange={handleChange}
                      />
                      <Input
                        label="INSURANCE TYPE"
                        name="insuranceType"
                        type="text"
                        placeholder="e.g. Package"
                        fullWidth
                        value={form.insuranceType}
                        onChange={handleChange}
                      />
                      <Input
                        label="POLICY NUMBER"
                        name="policyNumber"
                        type="text"
                        placeholder="Enter Policy Number"
                        fullWidth
                        value={form.policyNumber}
                        onChange={handleChange}
                      />
                      {/* <Input
                        label="INSURANCE DATE"
                        name="insuranceDate"
                        type="date"
                        fullWidth
                        value={form.insuranceDate}
                        onChange={handleChange}
                      /> */}
                      <Input
                        label="INSURANCE VALID FROM"
                        name="insuranceFrom"
                        type="date"
                        fullWidth
                        value={form.insuranceFrom}
                        onChange={handleChange}
                      />
                      <Input
                        label="INSURANCE VALID TO"
                        name="insuranceTo"
                        type="date"
                        fullWidth
                        value={form.insuranceTo}
                        onChange={handleChange}
                      />
                      <Input
                        label="INSURANCE CONTACT NO."
                        name="insuranceContactNo"
                        type="text"
                        placeholder="e.g. 9876543212"
                        fullWidth
                        value={form.insuranceContactNo}
                        onChange={handleChange}
                      />
                      <div className="lg:col-span-2">
                        <Input
                          label="INSURANCE ADDRESS"
                          name="insuranceAddress"
                          type="text"
                          placeholder="Insurance office address"
                          fullWidth
                          value={form.insuranceAddress}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <FileUpload
                      label="Insurance Documents"
                      name="insurance_documents"
                      existingFiles={vehicle?.documents?.insurance || []}
                      onFilesChange={(files) => handleFileChange('insurance_documents', files)}
                      onDeleteExisting={handleDeleteExistingDocument}
                    />
                  </AccordionItem>
                )}
                
                {/* Fitness */}
                {form.type === "Transport" && (
                  <AccordionItem key="fitness" title="Fitness Certificate">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                      <Input
                        label="F C NUMBER"
                        name="fcNumber"
                        type="text"
                        placeholder="Enter FC Number"
                        fullWidth
                        value={form.fcNumber}
                        onChange={handleChange}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="FITNESS VALID FROM"
                          name="fcTenureFrom"
                          type="date"
                          fullWidth
                          value={form.fcTenureFrom}
                          onChange={handleChange}
                        />
                        <Input
                          label="FITNESS VALID TO"
                          name="fcTenureTo"
                          type="date"
                          fullWidth
                          value={form.fcTenureTo}
                          onChange={handleChange}
                        />
                      </div>
                      <Input
                        label="CONTACT NO."
                        name="fcContactNo"
                        type="text"
                        placeholder="e.g. 9876543211"
                        fullWidth
                        value={form.fcContactNo}
                        onChange={handleChange}
                      />
                      <div className="lg:col-span-2">
                        <Input
                          label="ADDRESS"
                          name="fcAddress"
                          type="text"
                          placeholder="Fitness center address"
                          fullWidth
                          value={form.fcAddress}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <FileUpload
                      label="Fitness Documents"
                      name="fitness_documents"
                      existingFiles={vehicle?.documents?.fitness || []}
                      onFilesChange={(files) => handleFileChange('fitness_documents', files)}
                      onDeleteExisting={handleDeleteExistingDocument}
                    />
                  </AccordionItem>
                )}
                
                {/* Permit */}
                {form.type === "Transport" && (
                  <AccordionItem key="permit" title="Permit Details">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                      <Input
                        label="PERMIT NUMBER"
                        name="permitNumber"
                        type="text"
                        placeholder="Enter Permit Number"
                        fullWidth
                        value={form.permitNumber}
                        onChange={handleChange}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="PERMIT VALID FROM"
                          name="permitTenureFrom"
                          type="date"
                          fullWidth
                          value={form.permitTenureFrom}
                          onChange={handleChange}
                        />
                        <Input
                          label="PERMIT VALID TO"
                          name="permitTenureTo"
                          type="date"
                          fullWidth
                          value={form.permitTenureTo}
                          onChange={handleChange}
                        />
                      </div>
                      <Input
                        label="CONTACT NO."
                        name="permitContactNo"
                        type="text"
                        placeholder="e.g. 9876543211"
                        fullWidth
                        value={form.permitContactNo}
                        onChange={handleChange}
                      />
                      <div className="lg:col-span-2">
                        <Input
                          label="ADDRESS"
                          name="permitAddress"
                          type="text"
                          placeholder="Permit office address"
                          fullWidth
                          value={form.permitAddress}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <FileUpload
                      label="Permit Documents"
                      name="permit_documents"
                      existingFiles={vehicle?.documents?.permit || []}
                      onFilesChange={(files) => handleFileChange('permit_documents', files)}
                      onDeleteExisting={handleDeleteExistingDocument}
                    />
                  </AccordionItem>
                )}
                
                {/* Tax */}
                {(form.type === "Non Transport" || form.type === "Transport") && (
                  <AccordionItem key="tax" title="Tax Details">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                      <Input
                        label="TAX NUMBER"
                        name="taxNumber"
                        type="text"
                        placeholder="Enter Tax Number"
                        fullWidth
                        value={form.taxNumber}
                        onChange={handleChange}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="TAX VALID FROM"
                          name="taxTenureFrom"
                          type="date"
                          fullWidth
                          value={form.taxTenureFrom}
                          onChange={handleChange}
                        />
                        <Input
                          label="TAX VALID TO"
                          name="taxTenureTo"
                          type="date"
                          fullWidth
                          value={form.taxTenureTo}
                          onChange={handleChange}
                        />
                      </div>
                      <Input
                        label="TAX CONTACT NO."
                        name="taxContactNo"
                        type="text"
                        placeholder="e.g. 9876543211"
                        fullWidth
                        value={form.taxContactNo}
                        onChange={handleChange}
                      />
                      <div className="lg:col-span-2">
                        <Input
                          label="TAX ADDRESS"
                          name="taxAddress"
                          type="text"
                          placeholder="Tax office address"
                          fullWidth
                          value={form.taxAddress}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <FileUpload
                      label="Tax Documents"
                      name="tax_documents"
                      existingFiles={vehicle?.documents?.tax || []}
                      onFilesChange={(files) => handleFileChange('tax_documents', files)}
                      onDeleteExisting={handleDeleteExistingDocument}
                    />
                  </AccordionItem>
                )}
              </Accordion>

              <div className="flex justify-end mt-6">
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto"
                  isLoading={saving}
                >
                  {id ? "Update Vehicle" : "Register Vehicle"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </MainLayout>
  );
};

export default VehicleForm;