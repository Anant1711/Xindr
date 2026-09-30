
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "areas": {
                  Row: {
                    "city": string,"id": number,"lat": number,"lng": number,"name": string
                  }
                  Insert: {
                    "city": string,"id"?: never,"lat": number,"lng": number,"name": string
                  }
                  Update: {
                    "city"?: string,"id"?: never,"lat"?: number,"lng"?: number,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"blocks": {
                  Row: {
                    "blocked_id": string,"blocker_id": string,"created_at": string
                  }
                  Insert: {
                    "blocked_id": string,"blocker_id": string,"created_at"?: string
                  }
                  Update: {
                    "blocked_id"?: string,"blocker_id"?: string,"created_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "blocks_blocked_id_fkey"
      columns: ["blocked_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "blocks_blocker_id_fkey"
      columns: ["blocker_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"feedback": {
                  Row: {
                    "created_at": string,"id": string,"kind": string,"message": string,"user_id": string | null
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"kind": string,"message": string,"user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"kind"?: string,"message"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"gyms": {
                  Row: {
                    "area_id": number,"id": string,"name": string
                  }
                  Insert: {
                    "area_id": number,"id"?: string,"name": string
                  }
                  Update: {
                    "area_id"?: number,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "gyms_area_id_fkey"
      columns: ["area_id"]
isOneToOne: false
      referencedRelation: "areas"
      referencedColumns: ["id"]
    }
                  ]
                },"matches": {
                  Row: {
                    "created_at": string,"ended_at": string | null,"ended_by": string | null,"id": string,"request_id": string | null,"user_a": string,"user_b": string
                  }
                  Insert: {
                    "created_at"?: string,"ended_at"?: string | null,"ended_by"?: string | null,"id"?: string,"request_id"?: string | null,"user_a": string,"user_b": string
                  }
                  Update: {
                    "created_at"?: string,"ended_at"?: string | null,"ended_by"?: string | null,"id"?: string,"request_id"?: string | null,"user_a"?: string,"user_b"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "matches_ended_by_fkey"
      columns: ["ended_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "matches_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "train_requests"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "matches_user_a_fkey"
      columns: ["user_a"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "matches_user_b_fkey"
      columns: ["user_b"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"match_id": string,"read_at": string | null,"sender_id": string
                  }
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: string,"match_id": string,"read_at"?: string | null,"sender_id": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"match_id"?: string,"read_at"?: string | null,"sender_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_match_id_fkey"
      columns: ["match_id"]
isOneToOne: false
      referencedRelation: "matches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "area_id": number,"avatar_url": string | null,"confirmed_18_at": string,"created_at": string,"first_name": string,"focus": string | null,"gender": Database["public"]['Enums']["gender_t"],"gym_id": string | null,"id": string,"is_active": boolean,"last_initial": string,"level": Database["public"]['Enums']["level_t"],"show_me": Database["public"]['Enums']["show_me_t"],"time_of_day": Database["public"]['Enums']["time_of_day_t"],"training_days": (number)[],"updated_at": string,"women_only_visibility": boolean
                  }
                  Insert: {
                    "area_id": number,"avatar_url"?: string | null,"confirmed_18_at": string,"created_at"?: string,"first_name": string,"focus"?: string | null,"gender": Database["public"]['Enums']["gender_t"],"gym_id"?: string | null,"id": string,"is_active"?: boolean,"last_initial": string,"level": Database["public"]['Enums']["level_t"],"show_me"?: Database["public"]['Enums']["show_me_t"],"time_of_day": Database["public"]['Enums']["time_of_day_t"],"training_days"?: (number)[],"updated_at"?: string,"women_only_visibility"?: boolean
                  }
                  Update: {
                    "area_id"?: number,"avatar_url"?: string | null,"confirmed_18_at"?: string,"created_at"?: string,"first_name"?: string,"focus"?: string | null,"gender"?: Database["public"]['Enums']["gender_t"],"gym_id"?: string | null,"id"?: string,"is_active"?: boolean,"last_initial"?: string,"level"?: Database["public"]['Enums']["level_t"],"show_me"?: Database["public"]['Enums']["show_me_t"],"time_of_day"?: Database["public"]['Enums']["time_of_day_t"],"training_days"?: (number)[],"updated_at"?: string,"women_only_visibility"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_area_id_fkey"
      columns: ["area_id"]
isOneToOne: false
      referencedRelation: "areas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profiles_gym_id_fkey"
      columns: ["gym_id"]
isOneToOne: false
      referencedRelation: "gyms"
      referencedColumns: ["id"]
    }
                  ]
                },"reports": {
                  Row: {
                    "created_at": string,"details": string | null,"id": string,"reason": Database["public"]['Enums']["report_reason_t"],"reported_id": string | null,"reporter_id": string | null,"status": string
                  }
                  Insert: {
                    "created_at"?: string,"details"?: string | null,"id"?: string,"reason": Database["public"]['Enums']["report_reason_t"],"reported_id"?: string | null,"reporter_id"?: string | null,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"details"?: string | null,"id"?: string,"reason"?: Database["public"]['Enums']["report_reason_t"],"reported_id"?: string | null,"reporter_id"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_reported_id_fkey"
      columns: ["reported_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"train_requests": {
                  Row: {
                    "created_at": string,"from_user": string,"id": string,"note": string | null,"proposed_at": string,"responded_at": string | null,"status": Database["public"]['Enums']["request_status_t"],"to_user": string
                  }
                  Insert: {
                    "created_at"?: string,"from_user": string,"id"?: string,"note"?: string | null,"proposed_at": string,"responded_at"?: string | null,"status"?: Database["public"]['Enums']["request_status_t"],"to_user": string
                  }
                  Update: {
                    "created_at"?: string,"from_user"?: string,"id"?: string,"note"?: string | null,"proposed_at"?: string,"responded_at"?: string | null,"status"?: Database["public"]['Enums']["request_status_t"],"to_user"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "train_requests_from_user_fkey"
      columns: ["from_user"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "train_requests_to_user_fkey"
      columns: ["to_user"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "block_user":
{ Args: { "p_target": string }; Returns: undefined
                           },
"can_see":
{ Args: { "target": string,"viewer": string }; Returns: boolean
                           },
"cancel_request":
{ Args: { "p_request": string }; Returns: undefined
                           },
"distance_km":
{ Args: { "lat1": number,"lat2": number,"lng1": number,"lng2": number }; Returns: number
                           },
"end_match":
{ Args: { "p_match": string }; Returns: undefined
                           },
"expire_stale_requests":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"get_buddy_profile":
{ Args: { "p_id": string }; Returns: Database["public"]['CompositeTypes']["buddy_card"][]
                          SetofOptions: {
        from: "*"
        to: "buddy_card"
        isOneToOne: false
        isSetofReturn: true
      } },
"is_blocked":
{ Args: { "a": string,"b": string }; Returns: boolean
                           },
"mark_messages_read":
{ Args: { "p_match": string }; Returns: undefined
                           },
"my_conversations":
{ Args: Record<PropertyKey, never>; Returns: {
              "ended": boolean,"last_at": string,"last_body": string,"match_id": string,"other_first_name": string,"other_id": string,"other_last_initial": string,"unread_count": number
            }[]
                           },
"nearby_profiles":
{ Args: { "p_level"?: Database["public"]['Enums']["level_t"],"p_limit"?: number }; Returns: Database["public"]['CompositeTypes']["buddy_card"][]
                          SetofOptions: {
        from: "*"
        to: "buddy_card"
        isOneToOne: false
        isSetofReturn: true
      } },
"respond_to_request":
{ Args: { "p_accept": boolean,"p_request": string }; Returns: string
                           },
"send_request":
{ Args: { "p_note"?: string,"p_proposed_at": string,"p_to": string }; Returns: string
                           },
"shared_days":
{ Args: { "a": string,"b": string }; Returns: (number)[]
                           }
          }
          Enums: {
            "gender_t": "woman"|"man"|"other","level_t": "beginner"|"intermediate"|"pro","report_reason_t": "harassment"|"fake_profile"|"inappropriate_message"|"unsafe_behavior"|"other","request_status_t": "pending"|"accepted"|"declined"|"cancelled"|"expired","show_me_t": "women"|"men"|"anyone","time_of_day_t": "morning"|"evening"
          }
          CompositeTypes: {
            "buddy_card": {
                        "id": string | null,"first_name": string | null,"last_initial": string | null,"gender": Database["public"]['Enums']["gender_t"] | null,"level": Database["public"]['Enums']["level_t"] | null,"area_name": string | null,"gym_name": string | null,"same_gym": boolean | null,"distance_km": number | null,"time_of_day": Database["public"]['Enums']["time_of_day_t"] | null,"shared_days": (number)[] | null,"training_days": (number)[] | null,"focus": string | null
                      }
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "gender_t": ["woman", "man", "other"],"level_t": ["beginner", "intermediate", "pro"],"report_reason_t": ["harassment", "fake_profile", "inappropriate_message", "unsafe_behavior", "other"],"request_status_t": ["pending", "accepted", "declined", "cancelled", "expired"],"show_me_t": ["women", "men", "anyone"],"time_of_day_t": ["morning", "evening"]
          }
        }
} as const

