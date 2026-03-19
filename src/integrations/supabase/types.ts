export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance_logs: {
        Row: {
          admin_latitude: number | null
          admin_longitude: number | null
          attendance_date: string
          attendance_type: string
          branch_id: string | null
          created_at: string | null
          employee_id: string
          employee_latitude: number | null
          employee_longitude: number | null
          id: string
          location_id: string | null
          punch_in: string
          punch_out: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_latitude?: number | null
          admin_longitude?: number | null
          attendance_date: string
          attendance_type?: string
          branch_id?: string | null
          created_at?: string | null
          employee_id: string
          employee_latitude?: number | null
          employee_longitude?: number | null
          id?: string
          location_id?: string | null
          punch_in: string
          punch_out?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_latitude?: number | null
          admin_longitude?: number | null
          attendance_date?: string
          attendance_type?: string
          branch_id?: string | null
          created_at?: string | null
          employee_id?: string
          employee_latitude?: number | null
          employee_longitude?: number | null
          id?: string
          location_id?: string | null
          punch_in?: string
          punch_out?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blogs: {
        Row: {
          author_name: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          published_at: string | null
          slug: string | null
          status: string | null
          tags: string
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          slug?: string | null
          status?: string | null
          tags: string
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          slug?: string | null
          status?: string | null
          tags?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          branch_address: string | null
          branch_city: string | null
          branch_code: string | null
          branch_ip: Json | null
          branch_ip_cidrs: Json[] | null
          branch_name: string
          branch_state: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean
        }
        Insert: {
          branch_address?: string | null
          branch_city?: string | null
          branch_code?: string | null
          branch_ip?: Json | null
          branch_ip_cidrs?: Json[] | null
          branch_name: string
          branch_state?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
        }
        Update: {
          branch_address?: string | null
          branch_city?: string | null
          branch_code?: string | null
          branch_ip?: Json | null
          branch_ip_cidrs?: Json[] | null
          branch_name?: string
          branch_state?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "branches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          call_date: string
          call_status: string | null
          call_time: string
          call_type: string
          contact_name: string | null
          contact_phone: string
          created_at: string | null
          duration_seconds: number | null
          employee_id: string
          id: string
          lead_id: string | null
          note: string | null
          updated_at: string | null
        }
        Insert: {
          call_date?: string
          call_status?: string | null
          call_time?: string
          call_type: string
          contact_name?: string | null
          contact_phone: string
          created_at?: string | null
          duration_seconds?: number | null
          employee_id: string
          id?: string
          lead_id?: string | null
          note?: string | null
          updated_at?: string | null
        }
        Update: {
          call_date?: string
          call_status?: string | null
          call_time?: string
          call_type?: string
          contact_name?: string | null
          contact_phone?: string
          created_at?: string | null
          duration_seconds?: number | null
          employee_id?: string
          id?: string
          lead_id?: string | null
          note?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      career_applications: {
        Row: {
          created_at: string
          email: string
          experience: string | null
          id: string
          message: string | null
          name: string
          phone: string | null
          position: string
        }
        Insert: {
          created_at?: string
          email: string
          experience?: string | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          position: string
        }
        Update: {
          created_at?: string
          email?: string
          experience?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          position?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          favicon_url: string | null
          id: string
          logo_url: string | null
          phone: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          phone?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          phone?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          subject?: string
        }
        Relationships: []
      }
      customer_documents: {
        Row: {
          created_at: string | null
          customer_id: string | null
          document_number: string | null
          document_type: string
          document_url: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          document_number?: string | null
          document_type: string
          document_url: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          document_number?: string | null
          document_type?: string
          document_url?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          assigned_employee_id: string | null
          city: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          income_range: string | null
          lead_id: string | null
          loan_required: boolean | null
          loan_status: string | null
          phone: string
          source: string | null
          status: string | null
        }
        Insert: {
          address?: string | null
          assigned_employee_id?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          income_range?: string | null
          lead_id?: string | null
          loan_required?: boolean | null
          loan_status?: string | null
          phone: string
          source?: string | null
          status?: string | null
        }
        Update: {
          address?: string | null
          assigned_employee_id?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          income_range?: string | null
          lead_id?: string | null
          loan_required?: boolean | null
          loan_status?: string | null
          phone?: string
          source?: string | null
          status?: string | null
        }
        Relationships: []
      }
      employee_salary_structures: {
        Row: {
          basic: number | null
          conveyance: number | null
          created_at: string | null
          employee_id: string | null
          esi_applicable: boolean | null
          esi_employee_contribution: number | null
          esi_number: number | null
          gross_salary: number | null
          hra: number | null
          id: string
          medical: number | null
          net_payable: number | null
          other_allowance: number | null
          other_deductions: number | null
          pf_applicable: boolean | null
          pf_employee_contribution: number | null
          pf_number: number | null
          professional_tax: number | null
          salary_type: string | null
          special_allowance: number | null
          tds: number | null
          total_deductions: number | null
          uan_number: number | null
        }
        Insert: {
          basic?: number | null
          conveyance?: number | null
          created_at?: string | null
          employee_id?: string | null
          esi_applicable?: boolean | null
          esi_employee_contribution?: number | null
          esi_number?: number | null
          gross_salary?: number | null
          hra?: number | null
          id?: string
          medical?: number | null
          net_payable?: number | null
          other_allowance?: number | null
          other_deductions?: number | null
          pf_applicable?: boolean | null
          pf_employee_contribution?: number | null
          pf_number?: number | null
          professional_tax?: number | null
          salary_type?: string | null
          special_allowance?: number | null
          tds?: number | null
          total_deductions?: number | null
          uan_number?: number | null
        }
        Update: {
          basic?: number | null
          conveyance?: number | null
          created_at?: string | null
          employee_id?: string | null
          esi_applicable?: boolean | null
          esi_employee_contribution?: number | null
          esi_number?: number | null
          gross_salary?: number | null
          hra?: number | null
          id?: string
          medical?: number | null
          net_payable?: number | null
          other_allowance?: number | null
          other_deductions?: number | null
          pf_applicable?: boolean | null
          pf_employee_contribution?: number | null
          pf_number?: number | null
          professional_tax?: number | null
          salary_type?: string | null
          special_allowance?: number | null
          tds?: number | null
          total_deductions?: number | null
          uan_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_salary_structures_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          bedoptions: string | null
          budget: number | null
          created_at: string | null
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          preferred_date: string | null
          property_type: string | null
          status: string | null
          timeslot: string | null
          updated_at: string | null
        }
        Insert: {
          bedoptions?: string | null
          budget?: number | null
          created_at?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          preferred_date?: string | null
          property_type?: string | null
          status?: string | null
          timeslot?: string | null
          updated_at?: string | null
        }
        Update: {
          bedoptions?: string | null
          budget?: number | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          preferred_date?: string | null
          property_type?: string | null
          status?: string | null
          timeslot?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_properties: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          priority: string | null
          property_id: string
          shortlisted: boolean | null
          visit_status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          priority?: string | null
          property_id: string
          shortlisted?: boolean | null
          visit_status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          priority?: string | null
          property_id?: string
          shortlisted?: boolean | null
          visit_status?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          alternate_phone: string | null
          assigned_to: string | null
          branch_id: string | null
          budget: string | null
          city: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean | null
          last_contacted_at: string | null
          lead_score: number | null
          location: string | null
          name: string | null
          next_followup_at: string | null
          phone: string | null
          priority: string | null
          property_id: string | null
          property_name: string | null
          requirements: string | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          alternate_phone?: string | null
          assigned_to?: string | null
          branch_id?: string | null
          budget?: number | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_contacted_at?: string | null
          lead_score?: number | null
          location?: string | null
          name?: string | null
          next_followup_at?: string | null
          phone?: string | null
          priority?: string | null
          property_id?: string | null
          property_name?: string | null
          requirements?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          alternate_phone?: string | null
          assigned_to?: string | null
          branch_id?: string | null
          budget?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_contacted_at?: string | null
          lead_score?: number | null
          location?: string | null
          name?: string | null
          next_followup_at?: string | null
          phone?: string | null
          priority?: string | null
          property_id?: string | null
          property_name?: string | null
          requirements?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean
          key: string | null
          name: string
          order_no: number | null
          route: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          key?: string | null
          name: string
          order_no?: number | null
          route?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          key?: string | null
          name?: string
          order_no?: number | null
          route?: string | null
          status?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string | null
          module_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string | null
          module_id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string | null
          module_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aadhar_number: string | null
          aadhar_photo: string | null
          address: string | null
          attendance_type: string | null
          branch_id: string | null
          city: string | null
          department: string | null
          designation: string | null
          email: string | null
          employee_code: string
          experience: string | null
          id: string
          joining_date: string | null
          location_id: string[] | null
          name: string | null
          pan_number: string | null
          pan_photo: string | null
          password: string | null
          phone: string | null
          photo_path: string | null
          pincode: string | null
          previous_company: string | null
          previous_document_file: string | null
          previous_document_path: string | null
          previous_document_type: string | null
          reporting_manager_email: string | null
          reporting_manager_name: string | null
          reporting_manager_phone: string | null
          role_id: string
          state: string | null
          status: string
          total_experience: string | null
          updated_at: string | null
          user_id: string
          zone_id: string | null
        }
        Insert: {
          aadhar_number?: string | null
          aadhar_photo?: string | null
          address?: string | null
          attendance_type?: string | null
          branch_id?: string | null
          city?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          employee_code: string
          experience?: string | null
          id?: string
          joining_date?: string | null
          location_id?: string[] | null
          name?: string | null
          pan_number?: string | null
          pan_photo?: string | null
          password?: string | null
          phone?: string | null
          photo_path?: string | null
          pincode?: string | null
          previous_company?: string | null
          previous_document_file?: string | null
          previous_document_path?: string | null
          previous_document_type?: string | null
          reporting_manager_email?: string | null
          reporting_manager_name?: string | null
          reporting_manager_phone?: string | null
          role_id: string
          state?: string | null
          status: string
          total_experience?: string | null
          updated_at?: string | null
          user_id?: string
          zone_id?: string | null
        }
        Update: {
          aadhar_number?: string | null
          aadhar_photo?: string | null
          address?: string | null
          attendance_type?: string | null
          branch_id?: string | null
          city?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          employee_code?: string
          experience?: string | null
          id?: string
          joining_date?: string | null
          location_id?: string[] | null
          name?: string | null
          pan_number?: string | null
          pan_photo?: string | null
          password?: string | null
          phone?: string | null
          photo_path?: string | null
          pincode?: string | null
          previous_company?: string | null
          previous_document_file?: string | null
          previous_document_path?: string | null
          previous_document_type?: string | null
          reporting_manager_email?: string | null
          reporting_manager_name?: string | null
          reporting_manager_phone?: string | null
          role_id?: string
          state?: string | null
          status?: string
          total_experience?: string | null
          updated_at?: string | null
          user_id?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          age_of_property: number | null
          amenities: string | null
          bathrooms: number | null
          bedrooms: number | null
          branch_id: string | null
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          emi_available: boolean | null
          facing: string | null
          featured: boolean | null
          floor_number: number | null
          floor_plan: string | null
          furnishing: string | null
          id: string
          image_url: string | null
          lat: string | null
          listing_type: string | null
          location: string | null
          long: string | null
          negotiable: boolean | null
          pincode: string | null
          post_date: string | null
          price: number | null
          price_per_sqft: number | null
          property_type: string | null
          rera_number: string | null
          square_feet: number | null
          state: string | null
          status: string | null
          title: string
          total_floors: number | null
          updated_at: string
          user_id: string | null
          zone_id: string | null
        }
        Insert: {
          address?: string | null
          age_of_property?: number | null
          amenities?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          branch_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          emi_available?: boolean | null
          facing?: string | null
          featured?: boolean | null
          floor_number?: number | null
          floor_plan?: string | null
          furnishing?: string | null
          id?: string
          image_url?: string | null
          lat?: string | null
          listing_type?: string | null
          location?: string | null
          long?: string | null
          negotiable?: boolean | null
          pincode?: string | null
          post_date?: string | null
          price?: number | null
          price_per_sqft?: number | null
          property_type?: string | null
          rera_number?: string | null
          square_feet?: number | null
          state?: string | null
          status?: string | null
          title: string
          total_floors?: number | null
          updated_at?: string
          user_id?: string | null
          zone_id?: string | null
        }
        Update: {
          address?: string | null
          age_of_property?: number | null
          amenities?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          branch_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          emi_available?: boolean | null
          facing?: string | null
          featured?: boolean | null
          floor_number?: number | null
          floor_plan?: string | null
          furnishing?: string | null
          id?: string
          image_url?: string | null
          lat?: string | null
          listing_type?: string | null
          location?: string | null
          long?: string | null
          negotiable?: boolean | null
          pincode?: string | null
          post_date?: string | null
          price?: number | null
          price_per_sqft?: number | null
          property_type?: string | null
          rera_number?: string | null
          square_feet?: number | null
          state?: string | null
          status?: string | null
          title?: string
          total_floors?: number | null
          updated_at?: string
          user_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          property_id: string
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          property_id: string
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      role_modules: {
        Row: {
          created_at: string | null
          id: string
          module_id: string
          role_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          module_id: string
          role_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          module_id?: string
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          allowed: boolean | null
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          allowed?: boolean | null
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          allowed?: boolean | null
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          id: string
          name: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      site_visit_punches: {
        Row: {
          admin_latitude: number | null
          admin_longitude: number | null
          attendance_date: string
          created_at: string
          employee_id: string
          employee_latitude: number | null
          employee_longitude: number | null
          id: string
          punch_in: string
          punch_out: string | null
          site_visits_id: string | null
          updated_at: string
        }
        Insert: {
          admin_latitude?: number | null
          admin_longitude?: number | null
          attendance_date: string
          created_at?: string
          employee_id: string
          employee_latitude?: number | null
          employee_longitude?: number | null
          id?: string
          punch_in: string
          punch_out?: string | null
          site_visits_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_latitude?: number | null
          admin_longitude?: number | null
          attendance_date?: string
          created_at?: string
          employee_id?: string
          employee_latitude?: number | null
          employee_longitude?: number | null
          id?: string
          punch_in?: string
          punch_out?: string | null
          site_visits_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_visit_punches_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_visit_punches_site_visits_id_fkey"
            columns: ["site_visits_id"]
            isOneToOne: false
            referencedRelation: "site_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visits: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          lead_id: string | null
          note: string | null
          property_id: string | null
          status: string | null
          updated_at: string | null
          visit_date: string
          visit_time: string
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          lead_id?: string | null
          note?: string | null
          property_id?: string | null
          status?: string | null
          updated_at?: string | null
          visit_date: string
          visit_time: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          lead_id?: string | null
          note?: string | null
          property_id?: string | null
          status?: string | null
          updated_at?: string | null
          visit_date?: string
          visit_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_visits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_visits_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_id?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          active_locations: string[] | null
          branch_id: string | null
          city: string | null
          created_at: string
          description: string | null
          id: string
          locations: string[] | null
          state: string | null
          status: string | null
          updated_at: string | null
          zone_code: string | null
          zone_name: string | null
        }
        Insert: {
          active_locations?: string[] | null
          branch_id?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          locations?: string[] | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          zone_code?: string | null
          zone_name?: string | null
        }
        Update: {
          active_locations?: string[] | null
          branch_id?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          locations?: string[] | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          zone_code?: string | null
          zone_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zones_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_read_module: { Args: { module_uuid: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_admin_or_hr: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
