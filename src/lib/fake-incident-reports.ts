/**
 * Fake incident report data for demo and preview use.
 *
 * Shape mirrors the public.incident_reports and public.incident_people
 * Postgres tables defined in supabase/migrations. CSV-only fields with no
 * schema column (danger_level, physical_violence, evidence_files,
 * where_it_happened region, foreign_government_connection, original_id)
 * are preserved inside analysis_metadata.
 *
 * This data is never inserted into the database. It is kept in code so the
 * real submissions table stays clean. Gate exposure with the env var
 * NEXT_PUBLIC_SHOW_FAKE_INCIDENT_REPORTS=true.
 */

export type FakeIncidentReportRow = {
  readonly id: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly last_autosaved_at: string | null;
  readonly autosave_version: number;

  readonly incident_time_kind: "manual";
  readonly incident_occurred_at: string | null;
  readonly incident_time_note: string;

  readonly location_source: "manual";
  readonly location_label: string;
  readonly location_latitude: number | null;
  readonly location_longitude: number | null;
  readonly location_accuracy_meters: number | null;

  readonly narrative_text: string;
  readonly transcript_text: string;
  readonly transcript_model: string | null;
  readonly transcript_language: string | null;
  readonly transcript_updated_at: string | null;

  readonly quality_score: number;
  readonly quality_feedback: readonly string[];
  readonly checklist_state: readonly {
    readonly id: string;
    readonly label: string;
    readonly rationale: string;
    readonly completed: boolean;
  }[];
  readonly analysis_metadata: {
    readonly source: "fake_demo_data";
    readonly original_id: number;
    readonly danger_level: FakeDangerLevel;
    readonly physical_violence: FakePhysicalViolence;
    readonly evidence_files: readonly string[];
    readonly region: string;
    readonly foreign_government_connection: string;
  };

  readonly contact_consent: boolean;
  readonly contact_decided_at: string | null;
  readonly contact_consented_at: string | null;
  readonly contact_methods: readonly {
    readonly type: string;
    readonly value: string;
    readonly label?: string;
  }[];

  readonly device_source_hash: string;
};

export type FakeIncidentPersonRow = {
  readonly id: string;
  readonly report_id: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly source: "user";
  readonly display_name: string;
  readonly role: string;
  readonly description: string;
  readonly confidence: number | null;
  readonly sort_order: number;
};

export type FakeDangerLevel =
  | "immediate_attention_needed"
  | "danger_expected_within_a_week"
  | "not_immediate_danger";

export type FakePhysicalViolence =
  | "physical_violence_used"
  | "physical_violence_not_used";

type FakeSource = {
  readonly originalId: number;
  readonly createdAt: string;
  readonly occurredAt: string;
  readonly whoTargeted: string;
  readonly personDisplayName: string;
  readonly personRole: string;
  readonly whatHappened: string;
  readonly howContacted: string;
  readonly whatDemanded: string;
  readonly governmentConnection: string;
  readonly evidenceFiles: readonly string[];
  readonly dangerLevel: FakeDangerLevel;
  readonly whenNote: string;
  readonly locationLabel: string;
  readonly region: string;
  readonly physicalViolence: FakePhysicalViolence;
};

const fakeSources: readonly FakeSource[] = [
  {
    originalId: 107,
    createdAt: "2025-03-14T12:00:00.000Z",
    occurredAt: "2024-03-14T12:45:00.000Z",
    whoTargeted:
      "Agent from the Belarusian KGB, introduced himself as 'Alexei Morozov'",
    personDisplayName: "Alexei Morozov",
    personRole: "Belarusian KGB agent",
    whatHappened:
      "Man approached me outside my apartment building and showed me a photo of my sister still living in Minsk, implying he knew her location and daily schedule.",
    howContacted:
      "In-person confrontation. He drove a silver sedan with diplomatic plates and left a business card with only a handwritten phone number.",
    whatDemanded:
      "Demanded I stop participating in diaspora protests and provide names of Belarusian activists in Chicago, or 'something would happen' to my family back home.",
    governmentConnection:
      "Identified himself as a Belarusian government representative. Business card referenced 'Minsk coordination office'.",
    evidenceFiles: ["photo_business_card.jpg", "cctv_still_exterior.png"],
    dangerLevel: "danger_expected_within_a_week",
    whenNote:
      "March 14, 2024, 7:45 AM, outside my apartment building at 2210 Oak Street",
    locationLabel: "2210 Oak Street, Chicago, IL",
    region: "chicago_metro",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 108,
    createdAt: "2025-04-02T12:00:00.000Z",
    occurredAt: "2024-01-06T04:30:00.000Z",
    whoTargeted:
      "Unknown caller using a spoofed number matching my brother's contact in Tehran",
    personDisplayName: "Unknown spoofed caller",
    personRole: "Iranian Ministry of Intelligence operative",
    whatHappened:
      "Received a call where the caller played a recording of my brother's voice, then an unfamiliar voice warned me to cease publishing articles critical of the Iranian government.",
    howContacted:
      "Phone call from a spoofed number (+1-313-555-0182) that appeared as my brother Dariush in my contacts. Call lasted 4 minutes 22 seconds.",
    whatDemanded:
      "Told me to delete my Substack newsletter within 48 hours or my brother would face 'serious legal consequences' in Iran. Called me a 'traitor to the Republic'.",
    governmentConnection:
      "Caller referenced the Iranian Ministry of Intelligence by name and claimed to be acting on their behalf.",
    evidenceFiles: ["call_recording.m4a"],
    dangerLevel: "immediate_attention_needed",
    whenNote:
      "January 5, 2024, approximately 11:30 PM, at my home in Dearborn",
    locationLabel: "Dearborn, MI",
    region: "michigan",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 109,
    createdAt: "2025-04-18T12:00:00.000Z",
    occurredAt: "2023-11-20T19:00:00.000Z",
    whoTargeted:
      "Two individuals identifying as Chinese consulate officials, names given as 'Officer Wang' and 'Officer Li'",
    personDisplayName: "Officers Wang and Li",
    personRole: "Chinese consulate / United Front Work Department officials",
    whatHappened:
      "Visited my restaurant during business hours, sat two hours, then approached me in the back office claiming they were checking on my 'loyalty to the motherland'.",
    howContacted:
      "In-person visit to my business with no prior notice. They showed laminated IDs that appeared to be Chinese government credentials.",
    whatDemanded:
      "Asked me to report on Uyghur community members attending mosque events and share attendance lists. Implied my family in Xinjiang could face 're-education'.",
    governmentConnection:
      "Explicitly identified as Chinese consulate staff. Referenced the United Front Work Department. Mentioned my family in Urumqi by full name.",
    evidenceFiles: ["security_footage_clip.mp4", "id_photo_blurry.jpg"],
    dangerLevel: "immediate_attention_needed",
    whenNote:
      "November 20, 2023, 2:00–4:15 PM, at my restaurant on Canal Street in Manhattan",
    locationLabel: "Canal Street, Manhattan, NY",
    region: "nyc_metro",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 110,
    createdAt: "2025-05-07T12:00:00.000Z",
    occurredAt: "2024-02-01T09:00:00.000Z",
    whoTargeted:
      "Social media account @patriot_voice_ru (now suspended) that sent DMs over three weeks",
    personDisplayName: "@patriot_voice_ru",
    personRole: "Pro-Kremlin social media operator",
    whatHappened:
      "Account sent 47 messages over three weeks, alternating threats and flattery, ultimately demanding I remove YouTube videos about Russian military actions in Ukraine.",
    howContacted:
      "Instagram DMs from @patriot_voice_ru and Telegram from 'Igor_1984_official'. Messages arrived at irregular hours including 2–4 AM.",
    whatDemanded:
      "Threatened to 'find me wherever I am' and send location to 'people who handle traitors'. Demanded I post a video recanting anti-war statements within 7 days.",
    governmentConnection:
      "Account referenced Kremlin-linked media outlets approvingly and used language consistent with Russian state propaganda. No explicit government affiliation claimed.",
    evidenceFiles: ["screenshots_instagram.pdf", "telegram_export.json"],
    dangerLevel: "danger_expected_within_a_week",
    whenNote:
      "February 1–22, 2024, messages received at irregular hours including 2–4 AM",
    locationLabel: "Portland, OR",
    region: "oregon",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 111,
    createdAt: "2025-05-22T12:00:00.000Z",
    occurredAt: "2024-04-03T13:10:00.000Z",
    whoTargeted:
      "Unknown individuals who referenced 'orders from Addis Ababa' and claimed Ethiopian security service ties",
    personDisplayName: "Unknown Ethiopian NISS-linked actors",
    personRole: "Ethiopian NISS-linked actors",
    whatHappened:
      "My car tires were slashed and a note was left under the windshield wiper referencing specific details about family members still living in Ethiopia.",
    howContacted:
      "Physical typed note left on vehicle. Both tires on the driver side were punctured with a sharp instrument.",
    whatDemanded:
      "Note said: 'Stop spreading lies or your cousins Tadesse and Mekdes face consequences. We know where you work and where your children go to school.'",
    governmentConnection:
      "Note referenced 'Addis Ababa has eyes everywhere' and mentioned the Ethiopian National Intelligence and Security Service by acronym (NISS).",
    evidenceFiles: ["tire_damage_photos.zip", "note_scan.pdf"],
    dangerLevel: "immediate_attention_needed",
    whenNote:
      "April 3, 2024, discovered at 8:10 AM in the parking lot of my workplace",
    locationLabel: "Hartford, CT",
    region: "connecticut",
    physicalViolence: "physical_violence_used",
  },
  {
    originalId: 112,
    createdAt: "2025-06-05T12:00:00.000Z",
    occurredAt: "2023-12-12T08:14:00.000Z",
    whoTargeted:
      "Email sender using security.verification@gov-notify-sa.com, claiming Saudi General Intelligence Presidency",
    personDisplayName: "Saudi GIP-claimed email sender",
    personRole: "Claimed Saudi General Intelligence Presidency",
    whatHappened:
      "Received an email with a 12-page dossier about my personal life, finances, and associates that was largely accurate, demonstrating significant surveillance capability.",
    howContacted:
      "Email to my personal Gmail from spoofed domain gov-notify-sa.com. Contained my home address, car model, and children's school names.",
    whatDemanded:
      "Demanded I cease contact with journalist Jamal Al-Rashid and stop funding dissident media, or face 'asset freezes and family consequences'.",
    governmentConnection:
      "Email claimed Saudi General Intelligence Presidency and referenced the crown prince's office. Several dossier facts could only come from Saudi government records.",
    evidenceFiles: ["email_full_with_headers.eml", "dossier_attachment.pdf"],
    dangerLevel: "danger_expected_within_a_week",
    whenNote:
      "December 12, 2023, email received at 3:14 AM at my home in Tysons",
    locationLabel: "Tysons, VA",
    region: "washington_dc_metro",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 113,
    createdAt: "2025-06-19T12:00:00.000Z",
    occurredAt: "2023-09-08T19:00:00.000Z",
    whoTargeted:
      "Venezuelan SEBIN agent, contacted through an intermediary I know named Carlos Fuentes",
    personDisplayName: "Carlos Fuentes (intermediary for SEBIN)",
    personRole: "SEBIN intermediary",
    whatHappened:
      "Carlos relayed a warning that my bank accounts in Venezuela had been flagged and that my mother's pension would be suspended if I continued speaking out.",
    howContacted:
      "Indirect contact through acquaintance Carlos Fuentes (+58-412-555-0091) who relayed a verbal threat on behalf of an unidentified official.",
    whatDemanded:
      "Through Carlos: demanded I stop giving media interviews about Maduro and remove videos documenting a 2023 protest crackdown.",
    governmentConnection:
      "Carlos identified the contact as SEBIN (Bolivarian Intelligence Service) and referenced the Maduro administration by name.",
    evidenceFiles: [],
    dangerLevel: "not_immediate_danger",
    whenNote:
      "September 8, 2023, during an afternoon phone call at my home in Miami",
    locationLabel: "Miami, FL",
    region: "florida",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 114,
    createdAt: "2025-07-03T12:00:00.000Z",
    occurredAt: "2023-10-02T12:00:00.000Z",
    whoTargeted:
      "Pakistani ISI operatives, suspected based on their knowledge of classified details only ISI would possess",
    personDisplayName: "Suspected ISI operatives",
    personRole: "Pakistani ISI",
    whatHappened:
      "Received three letters mailed to my home containing photographs of me taken at various locations over a month, showing I was being physically surveilled.",
    howContacted:
      "Physical letters mailed to my home with no return address. Plain white envelopes. Photos printed on standard office paper.",
    whatDemanded:
      "Third letter stated: 'You have been watched. Your file has been sent to Islamabad. Cooperation is the only path to safety for your family.'",
    governmentConnection:
      "Third letter named ISI and referenced a Pakistani military court case number involving my brother—information not publicly available.",
    evidenceFiles: ["letters_scanned.pdf", "photo_prints_scan.pdf"],
    dangerLevel: "danger_expected_within_a_week",
    whenNote:
      "Letters received October 2, 9, and 16, 2023, at my home in Fremont",
    locationLabel: "Fremont, CA",
    region: "san_francisco_bay_area",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 115,
    createdAt: "2025-07-17T12:00:00.000Z",
    occurredAt: "2023-06-22T18:00:00.000Z",
    whoTargeted:
      "Turkish MIT operative posing as a journalist, introduced himself as 'Mehmet Arslan'",
    personDisplayName: "Mehmet Arslan",
    personRole: "Suspected Turkish MIT operative posing as journalist",
    whatHappened:
      "Agreed to an interview believing it was legitimate journalism. The 'journalist' made veiled references to my Gülen-affiliated relatives and asked for my contacts list.",
    howContacted:
      "Email from mehmet.arslan@haberturk-press.net (unofficial domain) requesting an interview. Follow-up phone call to +1-718-555-0203.",
    whatDemanded:
      "Asked for names and US locations of other Gülen movement members. Implied Turkish courts had an active file on me and cooperation would be 'noted favorably'.",
    governmentConnection:
      "Named MIT (Turkish National Intelligence Organization) as having interest in my case. Referenced the 2016 coup and named arrested relatives.",
    evidenceFiles: ["fake_press_id_photo.jpg", "email_chain.pdf"],
    dangerLevel: "not_immediate_danger",
    whenNote:
      "June 22, 2023, 2:00–3:45 PM, at a coffee shop on Steinway Street in Astoria, Queens",
    locationLabel: "Steinway Street, Astoria, Queens, NY",
    region: "nyc_metro",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 116,
    createdAt: "2025-08-01T12:00:00.000Z",
    occurredAt: "2023-08-15T02:47:00.000Z",
    whoTargeted:
      "Individuals believed affiliated with the Cambodian government based on knowledge of internal CPP party communications",
    personDisplayName: "Cambodian state-linked actors",
    personRole: "Cambodian government-linked intruders",
    whatHappened:
      "My laptop was broken into during a conference. Forensic analysis showed remote access software had been installed and encrypted documents were exfiltrated.",
    howContacted:
      "No direct contact. Physical intrusion into hotel room while I was at the conference dinner. Hotel key card logs showed a secondary entry at 10:47 PM.",
    whatDemanded:
      "No explicit demand. The compromise appeared intended to surveil my communications and contacts rather than issue immediate demands.",
    governmentConnection:
      "Digital forensics identified command-and-control servers linked to infrastructure attributed to Cambodian state-linked actors by CitizenLab researchers.",
    evidenceFiles: [
      "forensic_report.pdf",
      "hotel_keycard_log.png",
      "malware_hash.txt",
    ],
    dangerLevel: "not_immediate_danger",
    whenNote:
      "August 14–15, 2023 overnight, Room 412 at a hotel during the Democracy in Asia conference",
    locationLabel: "Conference hotel, Washington, DC",
    region: "washington_dc_metro",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 117,
    createdAt: "2025-08-15T12:00:00.000Z",
    occurredAt: "2024-05-03T16:00:00.000Z",
    whoTargeted:
      "Account claiming to represent Cuban State Security (G2), contacted via WhatsApp",
    personDisplayName: "Cuban G2-claimed contact",
    personRole: "Claimed Cuban State Security (G2)",
    whatHappened:
      "Received WhatsApp messages claiming my elderly parents in Havana were 'under observation' and that their housing situation depended on my behavior abroad.",
    howContacted:
      "WhatsApp messages from +53-5-555-0147 (Cuban country code). Sender used my first name and knew my parents' Havana street address.",
    whatDemanded:
      "Demanded I withdraw testimony agreed to before the UN Human Rights Committee regarding Cuban political prisoners. Gave me 72 hours.",
    governmentConnection:
      "Sender explicitly stated they were from Cuban State Security (G2). Named my parents and knew their CDR neighborhood watch file number.",
    evidenceFiles: ["whatsapp_screenshots.zip"],
    dangerLevel: "immediate_attention_needed",
    whenNote:
      "May 3, 2024, messages received over a 6-hour period starting at noon, at my office in Union City, NJ",
    locationLabel: "Union City, NJ",
    region: "nyc_metro",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 118,
    createdAt: "2025-08-29T12:00:00.000Z",
    occurredAt: "2024-03-30T19:00:00.000Z",
    whoTargeted:
      "North Korean government liaison, contacted through defector community member Kim Sung-ho",
    personDisplayName: "Kim Sung-ho (compelled courier)",
    personRole: "DPRK liaison-directed courier",
    whatHappened:
      "Kim delivered a USB drive containing a video of my relatives in Pyongyang and a recorded audio threat. Kim had been paid $500 in Seoul to bring it to me.",
    howContacted:
      "In-person delivery through Kim Sung-ho, who was approached at a café in Itaewon, Seoul by a man who gave him the USB and instructions.",
    whatDemanded:
      "Audio stated I must stop working with Liberty in North Korea (LiNK) or my family would be sent to a political prison camp. Named Camp 14 specifically.",
    governmentConnection:
      "The audio message referenced the Korean Workers' Party Central Committee. Level of detail about my family confirms state-level intelligence access.",
    evidenceFiles: [
      "usb_video_file.mp4",
      "audio_threat.mp3",
      "kim_statement.pdf",
    ],
    dangerLevel: "immediate_attention_needed",
    whenNote:
      "March 30, 2024, afternoon, at my apartment in Silver Spring, MD",
    locationLabel: "Silver Spring, MD",
    region: "washington_dc_metro",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 119,
    createdAt: "2025-09-12T12:00:00.000Z",
    occurredAt: "2023-07-11T17:30:00.000Z",
    whoTargeted:
      "Two men presenting Azerbaijani government IDs, claiming to be from an 'Azerbaijani Community Support Office'",
    personDisplayName: "Two Azerbaijani Embassy-linked officials",
    personRole: "Claimed Azerbaijani Ministry of Internal Affairs / embassy",
    whatHappened:
      "Visited my real estate office unannounced and met with me for 20 minutes, referencing my social media posts and my 2022 interview with RFE/RL by name.",
    howContacted:
      "Unannounced in-person visit. IDs appeared official but referenced a non-existent office. Left a pamphlet with a phone number.",
    whatDemanded:
      "Told me to 'be careful what you say publicly' and mentioned my business license could face 'complications'. Said my interviews were 'noticed in Baku'.",
    governmentConnection:
      "Presented government-issued IDs and referenced the Azerbaijani Ministry of Internal Affairs. One said they were 'attached to the embassy'.",
    evidenceFiles: ["office_camera_still.jpg", "pamphlet_scan.jpg"],
    dangerLevel: "not_immediate_danger",
    whenNote:
      "July 11, 2023, 1:30 PM, at my office on Connecticut Avenue NW",
    locationLabel: "Connecticut Avenue NW, Washington, DC",
    region: "washington_dc_metro",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 120,
    createdAt: "2025-09-26T12:00:00.000Z",
    occurredAt: "2023-10-05T14:00:00.000Z",
    whoTargeted:
      "Unknown callers from Tajikistan numbers, believed to be GKNB (Tajik security service) operatives",
    personDisplayName: "Unknown Tajik GKNB-linked callers",
    personRole: "Suspected Tajik GKNB operatives",
    whatHappened:
      "Received 14 calls over two weeks, most hung up. One call lasted 3 minutes and included threats. My Telegram was also cloned to contact my friends.",
    howContacted:
      "Phone calls from +992-37-555-XXXX numbers. Cloned Telegram account (@mirzo_official_2) messaged 6 contacts claiming I needed money urgently.",
    whatDemanded:
      "Caller stated I should 'go home and face the courts' and that my brother had already been detained as a guarantee of my return to Tajikistan.",
    governmentConnection:
      "Referenced specific Tajik court case numbers. Caller identified by name a GKNB officer supposedly handling my case.",
    evidenceFiles: ["call_log_screenshot.png", "telegram_clone_messages.pdf"],
    dangerLevel: "danger_expected_within_a_week",
    whenNote:
      "October 5–19, 2023, calls received at my home and workplace in Columbus",
    locationLabel: "Columbus, OH",
    region: "ohio",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 121,
    createdAt: "2025-10-10T12:00:00.000Z",
    occurredAt: "2023-02-14T19:00:00.000Z",
    whoTargeted:
      "Facebook user 'Nour Al-Amal', later identified by community members as working with Syrian mukhabarat",
    personDisplayName: "Nour Al-Amal",
    personRole: "Suspected Syrian Air Force Intelligence proxy",
    whatHappened:
      "Infiltrated my local Syrian diaspora support group online, gained trust over four months, then helped doxx several group members to a pro-Assad network.",
    howContacted:
      "Facebook group membership request accepted. Also connected on WhatsApp (+1-612-555-0088). Used a convincing fake Syrian refugee backstory.",
    whatDemanded:
      "After doxxing: 'You're next if you don't shut down this group.' Group was then flooded with threatening messages targeting individual members.",
    governmentConnection:
      "Pro-Assad Facebook pages that published our information coordinate with Syrian Air Force Intelligence. Community investigator confirmed the connection.",
    evidenceFiles: [
      "facebook_profile_archive.zip",
      "doxxing_posts_screenshots.pdf",
    ],
    dangerLevel: "danger_expected_within_a_week",
    whenNote:
      "Infiltration began November 2022; doxxing and threats against me occurred February 14, 2023",
    locationLabel: "Minneapolis, MN",
    region: "minnesota",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 122,
    createdAt: "2025-10-24T12:00:00.000Z",
    occurredAt: "2023-12-03T15:00:00.000Z",
    whoTargeted:
      "Unidentified persons who sent official-looking letters on apparent Sudanese government letterhead",
    personDisplayName: "Sudanese GIS-letterhead sender",
    personRole: "Claimed Sudanese General Intelligence Service",
    whatHappened:
      "Received three letters over two months claiming I was under investigation for 'financial crimes against the Sudanese state' and demanding I return for questioning.",
    howContacted:
      "Physical mail to my home. Letters had Sudanese government logos. One included a fraudulent Interpol notice confirmed fake via Interpol's public database.",
    whatDemanded:
      "Stated I had 30 days to present myself at the Sudanese embassy 'voluntarily' or risk an international arrest warrant and family asset seizure in Khartoum.",
    governmentConnection:
      "Letters bore the General Intelligence Service (GIS) of Sudan letterhead and referenced my specific political affiliations and diaspora organization memberships.",
    evidenceFiles: [
      "letter1_scan.pdf",
      "letter2_scan.pdf",
      "letter3_scan.pdf",
    ],
    dangerLevel: "not_immediate_danger",
    whenNote:
      "Letters received December 3, 17, 2023 and January 8, 2024 at my home in Alexandria, VA",
    locationLabel: "Alexandria, VA",
    region: "washington_dc_metro",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 123,
    createdAt: "2025-11-07T12:00:00.000Z",
    occurredAt: "2024-03-01T16:00:00.000Z",
    whoTargeted:
      "Rwandan government-linked hackers identified by Access Now forensics (Pegasus spyware on my device)",
    personDisplayName: "Rwandan-linked Pegasus operator",
    personRole: "Rwandan government-linked Pegasus operator",
    whatHappened:
      "My iPhone was infected with Pegasus spyware. Access Now confirmed the infection after I participated in a BBC interview about Rwandan detention of dissidents.",
    howContacted:
      "Zero-click exploit. I received a suspicious iMessage from +250-78-555-0032 on March 2 that may have been the infection vector.",
    whatDemanded:
      "No direct demand. Surveillance appeared aimed at identifying my sources and accessing my unpublished book manuscript content.",
    governmentConnection:
      "Access Now attributed the Pegasus deployment to infrastructure consistent with Rwanda's known Pegasus license, per prior CitizenLab reporting.",
    evidenceFiles: [
      "access_now_forensic_report.pdf",
      "mvt_scan_output.txt",
    ],
    dangerLevel: "not_immediate_danger",
    whenNote:
      "Infection installed March 1–5, 2024; discovered April 20, 2024 after device audit in Boston",
    locationLabel: "Boston, MA",
    region: "massachusetts",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 124,
    createdAt: "2025-11-21T12:00:00.000Z",
    occurredAt: "2023-08-25T22:00:00.000Z",
    whoTargeted:
      "Man identifying as Consul for Community Affairs at the Eritrean embassy, name given as 'Tewolde Haile'",
    personDisplayName: "Tewolde Haile",
    personRole: "Eritrean Embassy Consul for Community Affairs",
    whatHappened:
      "Approached me after an Eritrean community event, invited me for coffee, then spent an hour pressuring me to pay the diaspora tax and report members who refused.",
    howContacted:
      "In-person approach at a public community event. He had an Eritrean embassy business card. Later sent a follow-up text to my mobile, source of number unknown.",
    whatDemanded:
      "Stated the 2% diaspora tax was mandatory and non-payers were reported to Eritrean authorities. Said family property in Asmara was 'tied to compliance'.",
    governmentConnection:
      "Presented official Eritrean Embassy business card. Represents a documented Eritrean government practice condemned by UN human rights bodies.",
    evidenceFiles: [
      "business_card_photo.jpg",
      "text_message_screenshot.png",
    ],
    dangerLevel: "not_immediate_danger",
    whenNote:
      "August 25, 2023, 6:00–7:15 PM, at a community cultural event then a nearby café in Alexandria, VA",
    locationLabel: "Alexandria, VA",
    region: "washington_dc_metro",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 125,
    createdAt: "2025-12-05T12:00:00.000Z",
    occurredAt: "2023-09-10T17:00:00.000Z",
    whoTargeted:
      "Multiple coordinated accounts, at least one tied to Bangladesh Rapid Action Battalion (RAB) based on metadata",
    personDisplayName: "Coordinated harassment network (RAB-linked)",
    personRole: "Bangladesh RAB-linked harassment network",
    whatHappened:
      "Coordinated harassment campaign flooded my professional accounts. My employer received anonymous emails claiming I was a terrorism supporter.",
    howContacted:
      "Twitter/X, Facebook, LinkedIn, and email. Anonymous HR emails contained my correct employee ID, indicating an insider source or breach.",
    whatDemanded:
      "Employer email claimed I was 'under terror financing investigation' in Bangladesh and urged termination. DMs demanded I delete commentary about garment workers.",
    governmentConnection:
      "Twitter accounts traced to Dhaka IP ranges. One email header resolved to an address block linked to RAB in a 2022 researcher report.",
    evidenceFiles: [
      "employer_email_screenshots.pdf",
      "twitter_harassment_archive.zip",
    ],
    dangerLevel: "danger_expected_within_a_week",
    whenNote:
      "Campaign ran September 10 through October 1, 2023; employer emails sent during same period in Seattle",
    locationLabel: "Seattle, WA",
    region: "washington",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 126,
    createdAt: "2025-12-19T12:00:00.000Z",
    occurredAt: "2023-11-30T17:00:00.000Z",
    whoTargeted:
      "Individual calling himself 'Inspector Khodarahmi', claiming to be from the Iranian IRGC Intelligence",
    personDisplayName: "Inspector Khodarahmi",
    personRole: "Claimed IRGC Intelligence inspector",
    whatHappened:
      "Received a video call showing my cousin Sepideh in what appeared to be a Tehran detention facility. A man off-camera issued demands while she looked frightened.",
    howContacted:
      "WhatsApp video call from +98-21-555-0044. Call lasted approximately 8 minutes before the connection was cut without warning.",
    whatDemanded:
      "Demanded I provide US addresses of 5 specific Iranian-American journalists by name. Threatened Sepideh would be charged under Article 508 if I refused.",
    governmentConnection:
      "Caller identified as IRGC Intelligence and referenced Sepideh's arrest warrant number. Her lawyer has confirmed she is held in Evin Prison.",
    evidenceFiles: [
      "video_call_recording.mp4",
      "lawyers_written_confirmation.pdf",
    ],
    dangerLevel: "immediate_attention_needed",
    whenNote:
      "November 30, 2023, approximately 9:00 AM, at my home in Glendale",
    locationLabel: "Glendale, CA",
    region: "los_angeles_metro",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 127,
    createdAt: "2026-01-02T12:00:00.000Z",
    occurredAt: "2024-02-21T02:30:00.000Z",
    whoTargeted:
      "Unknown individual using AI voice synthesis, impersonating my father who lives in Hanoi, Vietnam",
    personDisplayName: "Vietnamese MPS-linked voice impersonator",
    personRole: "Suspected Vietnamese Ministry of Public Security operator",
    whatHappened:
      "Received a call sounding exactly like my father urging me to come home. When I called back on his verified number, my real father had not made any call.",
    howContacted:
      "Phone call to my mobile using AI voice synthesis of my father's voice. Caller ID showed a US area code number. Call lasted 2 minutes 41 seconds.",
    whatDemanded:
      "Synthesized voice said: 'Come home, there is a problem with your papers.' Designed to lure me to Vietnam, likely for detention by authorities.",
    governmentConnection:
      "Consistent with Vietnamese Ministry of Public Security tactics targeting overseas dissidents. My father was separately warned not to discuss this.",
    evidenceFiles: [
      "call_recording.m4a",
      "real_father_call_recording.m4a",
    ],
    dangerLevel: "danger_expected_within_a_week",
    whenNote:
      "February 20, 2024, 6:30 PM, at my home in Garden Grove",
    locationLabel: "Garden Grove, CA",
    region: "los_angeles_metro",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 128,
    createdAt: "2026-01-16T12:00:00.000Z",
    occurredAt: "2023-10-22T21:45:00.000Z",
    whoTargeted:
      "Two unidentified men in suits who followed me and confronted me, possibly Kazakhstani consulate-linked",
    personDisplayName: "Two Kazakhstani consulate-linked men",
    personRole: "Suspected Kazakhstani consulate operatives",
    whatHappened:
      "Noticed I was being followed after leaving a community meeting near the Kazakhstani consulate. The two men confronted me and made implicit threats about family in Almaty.",
    howContacted:
      "Physical surveillance followed by in-person confrontation. The men spoke Russian and Kazakh. One photographed me during the encounter.",
    whatDemanded:
      "Told me in Kazakh that my passport renewal would be 'complicated' unless I stopped attending opposition group meetings. Said 'Almaty knows your face.'",
    governmentConnection:
      "The individuals were observed coming from the direction of the Kazakhstani Consulate General on 59th Street. Referenced 'the office' as their authority.",
    evidenceFiles: ["subway_surveillance_still.jpg"],
    dangerLevel: "danger_expected_within_a_week",
    whenNote:
      "October 22, 2023, approximately 5:45 PM, near the 51st Street subway station in Midtown Manhattan",
    locationLabel: "51st Street subway, Midtown Manhattan, NY",
    region: "nyc_metro",
    physicalViolence: "physical_violence_used",
  },
  {
    originalId: 129,
    createdAt: "2026-01-30T12:00:00.000Z",
    occurredAt: "2024-04-08T17:00:00.000Z",
    whoTargeted:
      "Social media campaign and @truth_about_myanmarcoup, a Tatmadaw-linked account",
    personDisplayName: "@truth_about_myanmarcoup",
    personRole: "Tatmadaw-linked information operation",
    whatHappened:
      "Account published a fake screenshot attributing statements to me supporting armed resistance, used to defame me within the diaspora community.",
    howContacted:
      "DM from @truth_about_myanmarcoup on Twitter and a separate email to my employer. Messages arrived across multiple platforms simultaneously.",
    whatDemanded:
      "Demanded I post a video supporting the military council or more fabricated evidence would be released. Threatened to contact immigration authorities with false claims.",
    governmentConnection:
      "Account @truth_about_myanmarcoup has been linked to Tatmadaw information operations by the Stanford Internet Observatory.",
    evidenceFiles: [
      "fake_screenshot.png",
      "dm_screenshot.png",
      "stanford_io_report_excerpt.pdf",
    ],
    dangerLevel: "danger_expected_within_a_week",
    whenNote:
      "April 8–15, 2024, online harassment campaign while I was at home and work in San Jose",
    locationLabel: "San Jose, CA",
    region: "san_francisco_bay_area",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 130,
    createdAt: "2026-02-13T12:00:00.000Z",
    occurredAt: "2023-07-14T14:00:00.000Z",
    whoTargeted:
      "Individual claiming to represent Zimbabwe's Central Intelligence Organisation (CIO), gave name 'Brighton Moyo'",
    personDisplayName: "Brighton Moyo",
    personRole: "Claimed Zimbabwe Central Intelligence Organisation",
    whatHappened:
      "Moyo called claiming to facilitate 'voluntary dialogue' between the government and diaspora. He repeatedly referenced specific private conversations I had with friends.",
    howContacted:
      "Phone call from +263-77-555-0091. He claimed my number came from a community directory, but my number is not publicly listed anywhere.",
    whatDemanded:
      "Told me to stop funding the MDC Alliance or risk being 'persona non grata' in Zimbabwe. Said CIO had 'thick files' on diaspora activists.",
    governmentConnection:
      "Self-identified as CIO. Referenced a confidential government list of diaspora organizations not available from any public source.",
    evidenceFiles: ["call_log.png"],
    dangerLevel: "not_immediate_danger",
    whenNote:
      "July 14, 2023, 10:00 AM, phone call received at my home in Hartford",
    locationLabel: "Hartford, CT",
    region: "connecticut",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 131,
    createdAt: "2026-02-27T12:00:00.000Z",
    occurredAt: "2024-03-05T13:00:00.000Z",
    whoTargeted:
      "Unidentified group linked to Egyptian General Intelligence Service (GIS) based on prior communications pattern",
    personDisplayName: "Egyptian GIS-linked sender",
    personRole: "Claimed Egyptian General Intelligence Service",
    whatHappened:
      "Received surveillance photos of my home, car, and children's school taken over weeks, emailed as an attachment with no accompanying text message.",
    howContacted:
      "Email from xf77r@protonmail.com with 14 attached photos and no subject line or body. Showed my morning routine, children's school drop-off, and grocery trips.",
    whatDemanded:
      "Follow-up email two days later: 'We hope you understand what this means. Think carefully about your next article on Egyptian detentions.'",
    governmentConnection:
      "Prior email from 'Egyptian Expatriate Services' used language mirroring documented Egyptian GIS communications, per research published by Amnesty Tech.",
    evidenceFiles: [
      "surveillance_photos_redacted.zip",
      "email1.eml",
      "email2.eml",
    ],
    dangerLevel: "immediate_attention_needed",
    whenNote:
      "Photos received via email March 5, 2024; images taken late February through March 4 in Falls Church, VA",
    locationLabel: "Falls Church, VA",
    region: "washington_dc_metro",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 132,
    createdAt: "2026-03-13T12:00:00.000Z",
    occurredAt: "2023-05-17T23:30:00.000Z",
    whoTargeted:
      "Person presenting as Uzbek Embassy trade representative, gave name 'Farhodjon Yusupov'",
    personDisplayName: "Farhodjon Yusupov",
    personRole: "Uzbek Embassy Commercial Section representative",
    whatHappened:
      "Introduced himself at a business conference, then privately warned me during cocktail hour that my criticism of the Uzbek government was 'creating problems' for my relatives.",
    howContacted:
      "In-person at a professional event. He had an Uzbek Embassy Commercial Section business card. Later sent a LinkedIn connection request.",
    whatDemanded:
      "Said relatives' business licenses in Tashkent were 'under review'. Asked me to refrain from testifying at an upcoming USCIRF hearing on Uzbek prisoners.",
    governmentConnection:
      "Embassy business card confirmed Uzbek government affiliation. His prior knowledge of my private USCIRF invitation suggests intelligence access.",
    evidenceFiles: [
      "business_card_scan.jpg",
      "linkedin_connection_request.png",
    ],
    dangerLevel: "not_immediate_danger",
    whenNote:
      "May 17, 2023, approximately 7:30 PM, at the Central Asia Business Forum in McLean, VA",
    locationLabel: "McLean, VA",
    region: "washington_dc_metro",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 133,
    createdAt: "2026-03-27T12:00:00.000Z",
    occurredAt: "2023-08-07T15:00:00.000Z",
    whoTargeted:
      "Unknown actor using tools consistent with Moroccan DGED foreign intelligence operations, per digital forensics",
    personDisplayName: "Moroccan DGED-linked operator",
    personRole: "Suspected Moroccan DGED operator",
    whatHappened:
      "Phone targeted with a WhatsApp phishing attack. Clicking the link installed surveillance software that exfiltrated 3 weeks of messages before I discovered it.",
    howContacted:
      "WhatsApp message from +212-6-555-0173 disguised as a WhatsApp security verification using official branding. Convinced me to click the link.",
    whatDemanded:
      "After discovery, received a call from a Moroccan number: 'We have everything we need. Stay quiet about Sahara matters going forward.'",
    governmentConnection:
      "Digital forensics identified command servers linked to Moroccan DGED operations in reports published by Amnesty Tech.",
    evidenceFiles: [
      "forensic_analysis_report.pdf",
      "whatsapp_phishing_screenshot.png",
    ],
    dangerLevel: "danger_expected_within_a_week",
    whenNote:
      "Phishing link received August 7, 2023; malware discovered August 29, 2023 after a digital security audit in Detroit",
    locationLabel: "Detroit, MI",
    region: "michigan",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 134,
    createdAt: "2026-04-10T12:00:00.000Z",
    occurredAt: "2023-12-05T19:00:00.000Z",
    whoTargeted:
      "Person claiming to be from Algerian DRS intelligence; approached my landlord directly",
    personDisplayName: "Algerian Consular Legal Affairs visitor",
    personRole: "Claimed Algerian DRS / Consular Legal Affairs",
    whatHappened:
      "My landlord told me a man visited the building claiming to conduct a background investigation on behalf of Algerian authorities, asking about my visitors and schedule.",
    howContacted:
      "Indirect—through my landlord Robert Chen, who informed me that evening. The man left a card reading 'Algerian Consular Legal Affairs'.",
    whatDemanded:
      "Told my landlord I was 'wanted for questioning' and that my US status 'may be affected by outstanding Algerian legal matters'. Left a callback number.",
    governmentConnection:
      "Card referenced Algerian Consular Legal Affairs. The phone number connects to a line at the Algerian Embassy per public embassy directory listings.",
    evidenceFiles: [
      "landlord_written_statement.pdf",
      "business_card_photo.jpg",
    ],
    dangerLevel: "danger_expected_within_a_week",
    whenNote:
      "December 5, 2023, at my apartment building in the Bronx; my landlord informed me that same evening",
    locationLabel: "The Bronx, NY",
    region: "nyc_metro",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 135,
    createdAt: "2026-04-24T12:00:00.000Z",
    occurredAt: "2024-01-15T17:00:00.000Z",
    whoTargeted:
      "Pro-Kremlin troll network; primary operator reached out from Telegram account @dmitri_patriot_official",
    personDisplayName: "@dmitri_patriot_official",
    personRole: "Pro-Kremlin troll network operator",
    whatHappened:
      "Sustained 3-month harassment campaign targeting my journalism. Network reported my accounts with false claims, resulting in two temporary platform suspensions.",
    howContacted:
      "Harassment across Twitter/X, Telegram, and email. @dmitri_patriot_official sent DMs including my home neighborhood and physical description.",
    whatDemanded:
      "'Every journalist who lies about Russia is held accountable. We know your neighborhood. Keep writing and find out what accountability looks like.'",
    governmentConnection:
      "The coordinating Telegram channel is documented as part of a Kremlin-linked information operation by EU DisinfoLab. Russian Foreign Ministry amplified content.",
    evidenceFiles: [
      "telegram_message_screenshots.zip",
      "eu_disinfolab_excerpt.pdf",
    ],
    dangerLevel: "danger_expected_within_a_week",
    whenNote:
      "Campaign ran January through March 2024 while I was based in Philadelphia, PA",
    locationLabel: "Philadelphia, PA",
    region: "pennsylvania",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 136,
    createdAt: "2026-05-08T12:00:00.000Z",
    occurredAt: "2024-01-20T02:15:00.000Z",
    whoTargeted:
      "Two men posing as a community ride, later revealing ties to the Congolese ANR (Agence Nationale de Renseignements)",
    personDisplayName: "Two ANR-linked men",
    personRole: "Congolese ANR (Agence Nationale de Renseignements)",
    whatHappened:
      "What I believed was a friendly ride from JFK became a 40-minute interrogation about my work exposing DRC corruption, using details only from my private communications.",
    howContacted:
      "Arranged by a trusted community member (name withheld). The ride was offered as a favor. I had no reason to suspect malicious intent beforehand.",
    whatDemanded:
      "Claimed ANR had shared my file with Interpol. Offered a 'path forward' if I handed over source materials and unpublished reporting on the mining sector.",
    governmentConnection:
      "Identified themselves as ANR at the end of the ride. Knew details of internal DRC government communications referencing the President's office.",
    evidenceFiles: ["voice_memo_partial_recording.m4a"],
    dangerLevel: "immediate_attention_needed",
    whenNote:
      "January 19, 2024, approximately 9:15–10:00 PM, beginning at JFK Airport and ending in Queens",
    locationLabel: "JFK Airport / Queens, NY",
    region: "nyc_metro",
    physicalViolence: "physical_violence_used",
  },
];

const dangerScoreMap: Record<FakeDangerLevel, number> = {
  immediate_attention_needed: 92,
  danger_expected_within_a_week: 84,
  not_immediate_danger: 76,
};

const defaultChecklist = [
  {
    id: "chronology",
    label: "Put the account in time order.",
    rationale: "A timeline makes later review easier and reduces ambiguity.",
    completed: true,
  },
  {
    id: "time-and-place",
    label: "Record the most precise time and place you can safely provide.",
    rationale:
      "Approximate details are useful when exact details are not available.",
    completed: true,
  },
  {
    id: "people-and-roles",
    label: "Separate names, roles, and descriptions for each person involved.",
    rationale:
      "Clear person details help distinguish witnesses, responders, and subjects.",
    completed: true,
  },
] as const;

function makeReportId(originalId: number): string {
  const hex = originalId.toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${hex}`;
}

function makePersonId(originalId: number): string {
  const hex = originalId.toString(16).padStart(11, "0");
  return `00000000-0000-4000-8000-1${hex}`;
}

function makeDeviceHash(originalId: number): string {
  const idHex = originalId.toString(16).padStart(8, "0");
  return `${idHex}${"f".repeat(56)}`;
}

function buildNarrative(s: FakeSource): string {
  return [
    s.whatHappened,
    s.howContacted,
    s.whatDemanded,
    `Foreign government connection: ${s.governmentConnection}`,
    s.evidenceFiles.length
      ? `Evidence on file: ${s.evidenceFiles.join(", ")}`
      : "No evidence files attached.",
  ].join("\n\n");
}

function buildReport(s: FakeSource): FakeIncidentReportRow {
  return {
    id: makeReportId(s.originalId),
    created_at: s.createdAt,
    updated_at: s.createdAt,
    last_autosaved_at: s.createdAt,
    autosave_version: 1,

    incident_time_kind: "manual",
    incident_occurred_at: s.occurredAt,
    incident_time_note: s.whenNote,

    location_source: "manual",
    location_label: s.locationLabel,
    location_latitude: null,
    location_longitude: null,
    location_accuracy_meters: null,

    narrative_text: buildNarrative(s),
    transcript_text: "",
    transcript_model: null,
    transcript_language: null,
    transcript_updated_at: null,

    quality_score: dangerScoreMap[s.dangerLevel],
    quality_feedback: [],
    checklist_state: defaultChecklist,
    analysis_metadata: {
      source: "fake_demo_data",
      original_id: s.originalId,
      danger_level: s.dangerLevel,
      physical_violence: s.physicalViolence,
      evidence_files: s.evidenceFiles,
      region: s.region,
      foreign_government_connection: s.governmentConnection,
    },

    contact_consent: false,
    contact_decided_at: s.createdAt,
    contact_consented_at: null,
    contact_methods: [],

    device_source_hash: makeDeviceHash(s.originalId),
  };
}

function buildPerson(s: FakeSource): FakeIncidentPersonRow {
  return {
    id: makePersonId(s.originalId),
    report_id: makeReportId(s.originalId),
    created_at: s.createdAt,
    updated_at: s.createdAt,
    source: "user",
    display_name: s.personDisplayName,
    role: s.personRole,
    description: s.whoTargeted,
    confidence: null,
    sort_order: 0,
  };
}

export const fakeIncidentReports: readonly FakeIncidentReportRow[] =
  fakeSources.map(buildReport);

export const fakeIncidentPeople: readonly FakeIncidentPersonRow[] =
  fakeSources.map(buildPerson);

export type FakeIncidentReportWithPeople = {
  readonly report: FakeIncidentReportRow;
  readonly people: readonly FakeIncidentPersonRow[];
};

export const fakeIncidentReportsWithPeople: readonly FakeIncidentReportWithPeople[] =
  fakeIncidentReports.map((report) => ({
    report,
    people: fakeIncidentPeople.filter(
      (person) => person.report_id === report.id,
    ),
  }));

export function shouldShowFakeIncidentReports(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_FAKE_INCIDENT_REPORTS === "true";
}

export function getFakeIncidentReports(): readonly FakeIncidentReportRow[] {
  return shouldShowFakeIncidentReports() ? fakeIncidentReports : [];
}

export function getFakeIncidentPeople(): readonly FakeIncidentPersonRow[] {
  return shouldShowFakeIncidentReports() ? fakeIncidentPeople : [];
}

export function getFakeIncidentReportsWithPeople(): readonly FakeIncidentReportWithPeople[] {
  return shouldShowFakeIncidentReports() ? fakeIncidentReportsWithPeople : [];
}
