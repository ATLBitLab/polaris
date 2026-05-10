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
      "Agent from the Chinese Ministry of State Security (MSS), introduced himself as 'Mr. Liu' (likely an alias)",
    personDisplayName: "'Mr. Liu' (MSS agent)",
    personRole: "Chinese Ministry of State Security operative",
    whatHappened:
      "Man approached me outside my apartment building and showed me a photo of my sister still living in Lhasa, implying he knew her location and daily schedule.",
    howContacted:
      "In-person confrontation. He drove a silver sedan with diplomatic plates and left a business card with only a handwritten phone number.",
    whatDemanded:
      "Demanded I stop participating in Tibetan freedom protests and provide names of Tibetan activists in Chicago, or 'something would happen' to my family back home.",
    governmentConnection:
      "Identified himself as a representative of the Chinese government. Business card referenced 'Beijing liaison office'.",
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
      "Unknown caller using a spoofed number matching my brother's contact in Beijing",
    personDisplayName: "Unknown spoofed caller",
    personRole: "Suspected Chinese MSS operator",
    whatHappened:
      "Received a call where the caller played a recording of my brother's voice, then an unfamiliar voice warned me to cease publishing articles critical of the Chinese government.",
    howContacted:
      "Phone call from a spoofed number (+1-313-555-0182) that appeared as my brother Wei in my contacts. Call lasted 4 minutes 22 seconds.",
    whatDemanded:
      "Told me to delete my Substack newsletter within 48 hours or my brother would face 'serious legal consequences' in China. Called me a 'traitor to the Party'.",
    governmentConnection:
      "Caller referenced the Chinese Ministry of State Security by name and claimed to be acting on their behalf.",
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
      "Social media account @loyal_huaxia_voice (now suspended) that sent DMs over three weeks",
    personDisplayName: "@loyal_huaxia_voice",
    personRole: "Pro-Beijing social media operator",
    whatHappened:
      "Account sent 47 messages over three weeks, alternating threats and flattery, ultimately demanding I remove YouTube videos documenting Chinese government repression in Hong Kong.",
    howContacted:
      "Instagram DMs from @loyal_huaxia_voice and Telegram from 'Wang_loyalty_2024'. Messages arrived at irregular hours including 2–4 AM.",
    whatDemanded:
      "Threatened to 'find me wherever I am' and send my location to 'people who handle traitors of the motherland'. Demanded I post a video recanting anti-CCP statements within 7 days.",
    governmentConnection:
      "Account referenced CCP-linked state media approvingly and used language consistent with Chinese state propaganda. No explicit government affiliation claimed.",
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
      "Unknown individuals who referenced 'orders from Beijing' and claimed Chinese state security ties",
    personDisplayName: "Unknown MSS-linked actors",
    personRole: "Chinese Ministry of State Security–linked actors",
    whatHappened:
      "My car tires were slashed and a note was left under the windshield wiper referencing specific details about family members still living in China.",
    howContacted:
      "Physical typed note left on vehicle. Both tires on the driver side were punctured with a sharp instrument.",
    whatDemanded:
      "Note said: 'Stop spreading lies or your cousins Lin and Mei face consequences. We know where you work and where your children go to school.'",
    governmentConnection:
      "Note referenced 'Beijing has eyes everywhere' and mentioned the Chinese Ministry of State Security by acronym (MSS).",
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
      "Email sender using security.notify@gov-cn-secure.com, claiming Chinese Ministry of State Security",
    personDisplayName: "MSS-claimed email sender",
    personRole: "Claimed Chinese Ministry of State Security",
    whatHappened:
      "Received an email with a 12-page dossier about my personal life, finances, and associates that was largely accurate, demonstrating significant surveillance capability.",
    howContacted:
      "Email to my personal Gmail from spoofed domain gov-cn-secure.com. Contained my home address, car model, and children's school names.",
    whatDemanded:
      "Demanded I cease contact with journalist Chen Wei and stop funding dissident media, or face 'asset freezes and family consequences'.",
    governmentConnection:
      "Email claimed Chinese Ministry of State Security and referenced the Politburo. Several dossier facts could only come from Chinese government records.",
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
      "Chinese MSS agent, contacted through an intermediary I know named Chen Liwei",
    personDisplayName: "Chen Liwei (intermediary for MSS)",
    personRole: "MSS intermediary",
    whatHappened:
      "Chen relayed a warning that my bank accounts in China had been frozen and that my mother's pension would be suspended if I continued speaking out.",
    howContacted:
      "Indirect contact through acquaintance Chen Liwei (+86-138-555-0091) who relayed a verbal threat on behalf of an unidentified official.",
    whatDemanded:
      "Through Chen: demanded I stop giving media interviews about Xi Jinping and remove videos documenting the 2022 White Paper protest crackdown.",
    governmentConnection:
      "Chen identified the contact as Ministry of State Security (MSS) and referenced the Xi Jinping administration by name.",
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
      "Chinese MSS operatives, suspected based on their knowledge of classified details only MSS would possess",
    personDisplayName: "Suspected MSS operatives",
    personRole: "Chinese Ministry of State Security",
    whatHappened:
      "Received three letters mailed to my home containing photographs of me taken at various locations over a month, showing I was being physically surveilled.",
    howContacted:
      "Physical letters mailed to my home with no return address. Plain white envelopes. Photos printed on standard office paper.",
    whatDemanded:
      "Third letter stated: 'You have been watched. Your file has been sent to Beijing. Cooperation is the only path to safety for your family.'",
    governmentConnection:
      "Third letter named the MSS and referenced a Chinese court case number involving my brother—information not publicly available.",
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
      "Chinese MSS operative posing as a journalist, introduced himself as 'Zhang Wei'",
    personDisplayName: "Zhang Wei",
    personRole: "Suspected Chinese MSS operative posing as journalist",
    whatHappened:
      "Agreed to an interview believing it was legitimate journalism. The 'journalist' made veiled references to my Falun Gong–practicing relatives and asked for my contacts list.",
    howContacted:
      "Email from zhang.wei@huanqiu-press.net (unofficial domain) requesting an interview. Follow-up phone call to +1-718-555-0203.",
    whatDemanded:
      "Asked for names and US locations of other Falun Gong practitioners. Implied Chinese courts had an active file on me and cooperation would be 'noted favorably'.",
    governmentConnection:
      "Named the Ministry of State Security (MSS) as having interest in my case. Referenced the 1999 Falun Gong crackdown and named detained relatives.",
    evidenceFiles: ["fake_press_id_photo.jpg", "email_chain.pdf"],
    dangerLevel: "not_immediate_danger",
    whenNote:
      "June 22, 2023, 2:00–3:45 PM, at a coffee shop on Main Street in Flushing, Queens",
    locationLabel: "Main Street, Flushing, Queens, NY",
    region: "nyc_metro",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 116,
    createdAt: "2025-08-01T12:00:00.000Z",
    occurredAt: "2023-08-15T02:47:00.000Z",
    whoTargeted:
      "Individuals believed affiliated with the Chinese government based on knowledge of internal CCP communications",
    personDisplayName: "Chinese state-linked actors",
    personRole: "Chinese government-linked intruders",
    whatHappened:
      "My laptop was broken into during a conference. Forensic analysis showed remote access software had been installed and encrypted documents were exfiltrated.",
    howContacted:
      "No direct contact. Physical intrusion into hotel room while I was at the conference dinner. Hotel key card logs showed a secondary entry at 10:47 PM.",
    whatDemanded:
      "No explicit demand. The compromise appeared intended to surveil my communications and contacts rather than issue immediate demands.",
    governmentConnection:
      "Digital forensics identified command-and-control servers linked to infrastructure attributed to Chinese state-aligned actors by Citizen Lab researchers.",
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
      "Account claiming to represent the Chinese Ministry of State Security, contacted via WeChat",
    personDisplayName: "MSS-claimed WeChat contact",
    personRole: "Claimed Chinese Ministry of State Security (MSS)",
    whatHappened:
      "Received WeChat messages claiming my elderly parents in Beijing were 'under observation' and that their housing situation depended on my behavior abroad.",
    howContacted:
      "WeChat messages from +86-138-555-0147 (Chinese country code). Sender used my first name and knew my parents' Beijing street address.",
    whatDemanded:
      "Demanded I withdraw testimony agreed to before the UN Human Rights Committee regarding Chinese political prisoners and Uyghur detainees. Gave me 72 hours.",
    governmentConnection:
      "Sender explicitly stated they were from the Chinese Ministry of State Security. Named my parents and knew their grid management household ID number.",
    evidenceFiles: ["wechat_screenshots.zip"],
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
      "Chinese government liaison, contacted through diaspora community member Wang Lei",
    personDisplayName: "Wang Lei (compelled courier)",
    personRole: "MSS-directed courier",
    whatHappened:
      "Wang delivered a USB drive containing a video of my relatives in Chongqing and a recorded audio threat. Wang had been paid $500 in Hong Kong to bring it to me.",
    howContacted:
      "In-person delivery through Wang Lei, who was approached at a café in Wan Chai, Hong Kong by a man who gave him the USB and instructions.",
    whatDemanded:
      "Audio stated I must stop working with China Aid or my family would be sent to a Xinjiang re-education camp. Named a specific facility in Aksu Prefecture.",
    governmentConnection:
      "The audio message referenced the United Front Work Department. Level of detail about my family confirms state-level intelligence access.",
    evidenceFiles: [
      "usb_video_file.mp4",
      "audio_threat.mp3",
      "wang_statement.pdf",
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
      "Two men presenting Chinese consulate IDs, claiming to be from an 'Office of Overseas Chinese Affairs'",
    personDisplayName: "Two Chinese consulate-linked officials",
    personRole: "Claimed Chinese consulate / Overseas Chinese Affairs Office",
    whatHappened:
      "Visited my real estate office unannounced and met with me for 20 minutes, referencing my social media posts and my 2022 interview with RFA by name.",
    howContacted:
      "Unannounced in-person visit. IDs appeared official but referenced a non-existent office. Left a pamphlet with a phone number.",
    whatDemanded:
      "Told me to 'be careful what you say publicly' and mentioned my business license could face 'complications'. Said my interviews were 'noticed in Beijing'.",
    governmentConnection:
      "Presented government-issued IDs and referenced the Chinese Ministry of Public Security. One said they were 'attached to the embassy'.",
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
      "Unknown callers from Chinese numbers, believed to be MSS (Chinese Ministry of State Security) operatives",
    personDisplayName: "Unknown MSS-linked callers",
    personRole: "Suspected Chinese MSS operatives",
    whatHappened:
      "Received 14 calls over two weeks, most hung up. One call lasted 3 minutes and included threats. My WeChat was also cloned to contact my friends.",
    howContacted:
      "Phone calls from +86-10-555-XXXX numbers. Cloned WeChat account (zhangbo_official_2) messaged 6 contacts claiming I needed money urgently.",
    whatDemanded:
      "Caller stated I should 'go home and face the courts' and that my brother had already been detained as a guarantee of my return to China.",
    governmentConnection:
      "Referenced specific Chinese court case numbers. Caller identified by name an MSS officer supposedly handling my case.",
    evidenceFiles: ["call_log_screenshot.png", "wechat_clone_messages.pdf"],
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
      "Facebook user 'Anna Wang', later identified by community members as working with Chinese state security",
    personDisplayName: "Anna Wang",
    personRole: "Suspected Chinese MSS proxy",
    whatHappened:
      "Infiltrated my local Hong Kong diaspora support group online, gained trust over four months, then helped doxx several group members to a pro-Beijing network.",
    howContacted:
      "Facebook group membership request accepted. Also connected on WhatsApp (+1-612-555-0088). Used a convincing fake Hong Kong refugee backstory.",
    whatDemanded:
      "After doxxing: 'You're next if you don't shut down this group.' Group was then flooded with threatening messages targeting individual members.",
    governmentConnection:
      "Pro-Beijing Facebook pages that published our information coordinate with Chinese state-linked information operators. Community investigator confirmed the connection.",
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
      "Unidentified persons who sent official-looking letters on apparent Chinese government letterhead",
    personDisplayName: "MSS-letterhead sender",
    personRole: "Claimed Chinese Ministry of State Security",
    whatHappened:
      "Received three letters over two months claiming I was under investigation for 'national security crimes against the Chinese state' and demanding I return for questioning.",
    howContacted:
      "Physical mail to my home. Letters had Chinese government logos. One included a fraudulent Interpol red notice confirmed fake via Interpol's public database.",
    whatDemanded:
      "Stated I had 30 days to present myself at the Chinese embassy 'voluntarily' or risk an international arrest warrant and family asset seizure in Beijing.",
    governmentConnection:
      "Letters bore the Ministry of State Security letterhead and referenced my specific political affiliations and diaspora organization memberships.",
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
      "Chinese state-linked hackers identified by Citizen Lab forensics (mobile surveillance malware on my device)",
    personDisplayName: "Chinese state-linked spyware operator",
    personRole: "Chinese state-aligned surveillance operator",
    whatHappened:
      "My iPhone was infected with Chinese state-aligned surveillance malware. Citizen Lab confirmed the infection after I participated in a BBC interview about the Xinjiang detention system.",
    howContacted:
      "Zero-click exploit. I received a suspicious iMessage from +86-10-555-0032 on March 2 that may have been the infection vector.",
    whatDemanded:
      "No direct demand. Surveillance appeared aimed at identifying my sources and accessing my unpublished book manuscript content.",
    governmentConnection:
      "Citizen Lab attributed the surveillance deployment to infrastructure consistent with Chinese state-aligned operators tracked in prior reporting.",
    evidenceFiles: [
      "citizen_lab_forensic_report.pdf",
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
      "Man identifying as Consul for Overseas Chinese Affairs at the Chinese embassy, name given as 'Wang Yiming'",
    personDisplayName: "Wang Yiming",
    personRole: "Chinese Embassy Consul for Overseas Chinese Affairs",
    whatHappened:
      "Approached me after a Chinese-American community event, invited me for tea, then spent an hour pressuring me to register with the local Overseas Chinese Association and report members deemed 'politically unreliable'.",
    howContacted:
      "In-person approach at a public community event. He had a Chinese embassy business card. Later sent a follow-up text to my mobile, source of number unknown.",
    whatDemanded:
      "Stated registration with the Overseas Chinese Association was expected for passport renewal and that non-cooperation was reported to Beijing. Said family property in Shanghai was 'tied to compliance'.",
    governmentConnection:
      "Presented official Chinese Embassy business card. Represents a documented Chinese government practice condemned in US and UN reports on transnational repression.",
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
      "Multiple coordinated accounts, at least one tied to Chinese state-aligned information operators based on metadata",
    personDisplayName: "Coordinated harassment network (China-linked)",
    personRole: "Chinese state-linked harassment network",
    whatHappened:
      "Coordinated harassment campaign flooded my professional accounts. My employer received anonymous emails claiming I was a terrorism supporter.",
    howContacted:
      "Twitter/X, Facebook, LinkedIn, and email. Anonymous HR emails contained my correct employee ID, indicating an insider source or breach.",
    whatDemanded:
      "Employer email claimed I was 'under national security investigation' in China and urged termination. DMs demanded I delete commentary about Uyghur forced labor in supply chains.",
    governmentConnection:
      "Twitter accounts traced to Beijing IP ranges. One email header resolved to an address block linked to a Chinese state-aligned operator group in a 2022 ASPI report.",
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
      "Individual calling himself 'Inspector Liu', claiming to be from the Chinese Ministry of State Security",
    personDisplayName: "Inspector Liu",
    personRole: "Claimed MSS inspector",
    whatHappened:
      "Received a video call showing my cousin Mei in what appeared to be a Chinese detention facility. A man off-camera issued demands while she looked frightened.",
    howContacted:
      "WeChat video call from +86-10-555-0044. Call lasted approximately 8 minutes before the connection was cut without warning.",
    whatDemanded:
      "Demanded I provide US addresses of 5 specific Chinese-American journalists by name. Threatened Mei would be charged under Article 105 of the Chinese Criminal Law (subversion of state power) if I refused.",
    governmentConnection:
      "Caller identified as MSS and referenced Mei's arrest warrant number. Her lawyer has confirmed she is held in Qincheng Prison.",
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
      "Unknown individual using AI voice synthesis, impersonating my father who lives in Chongqing, China",
    personDisplayName: "Chinese MSS-linked voice impersonator",
    personRole: "Suspected Chinese Ministry of State Security operator",
    whatHappened:
      "Received a call sounding exactly like my father urging me to come home. When I called back on his verified number, my real father had not made any call.",
    howContacted:
      "Phone call to my mobile using AI voice synthesis of my father's voice. Caller ID showed a US area code number. Call lasted 2 minutes 41 seconds.",
    whatDemanded:
      "Synthesized voice said: 'Come home, there is a problem with your papers.' Designed to lure me to China, likely for detention by authorities.",
    governmentConnection:
      "Consistent with Chinese Ministry of State Security tactics targeting overseas dissidents under Operation Fox Hunt. My father was separately warned not to discuss this.",
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
      "Two unidentified men in suits who followed me and confronted me, possibly Chinese consulate-linked",
    personDisplayName: "Two Chinese consulate-linked men",
    personRole: "Suspected Chinese consulate operatives",
    whatHappened:
      "Noticed I was being followed after leaving a Hong Kong diaspora community meeting in Midtown. The two men confronted me and made implicit threats about family in Beijing.",
    howContacted:
      "Physical surveillance followed by in-person confrontation. The men spoke Mandarin. One photographed me during the encounter.",
    whatDemanded:
      "Told me in Mandarin that my passport renewal would be 'complicated' unless I stopped attending pro-democracy group meetings. Said 'Beijing knows your face.'",
    governmentConnection:
      "The individuals were observed coming from the direction of a known Chinese consulate office. Referenced 'the office' as their authority.",
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
      "Social media campaign and @real_china_voice, a Chinese state-linked account",
    personDisplayName: "@real_china_voice",
    personRole: "Chinese state-linked information operation",
    whatHappened:
      "Account published a fake screenshot attributing statements to me supporting Hong Kong independence, used to defame me within the Chinese-American diaspora community.",
    howContacted:
      "DM from @real_china_voice on Twitter and a separate email to my employer. Messages arrived across multiple platforms simultaneously.",
    whatDemanded:
      "Demanded I post a video supporting the Chinese government or more fabricated evidence would be released. Threatened to contact immigration authorities with false claims.",
    governmentConnection:
      "Account @real_china_voice has been linked to Chinese state-aligned information operations by the Stanford Internet Observatory.",
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
      "Individual claiming to represent the Chinese Ministry of State Security, gave name 'Liu Bin'",
    personDisplayName: "Liu Bin",
    personRole: "Claimed Chinese Ministry of State Security",
    whatHappened:
      "Liu called claiming to facilitate 'voluntary dialogue' between the government and the overseas Chinese community. He repeatedly referenced specific private conversations I had with friends.",
    howContacted:
      "Phone call from +86-10-555-0091. He claimed my number came from a community directory, but my number is not publicly listed anywhere.",
    whatDemanded:
      "Told me to stop funding Hong Kong Watch or risk being 'persona non grata' in China. Said the MSS had 'thick files' on diaspora activists.",
    governmentConnection:
      "Self-identified as MSS. Referenced a confidential government list of diaspora organizations not available from any public source.",
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
      "Unidentified group linked to the Chinese Ministry of State Security based on prior communications pattern",
    personDisplayName: "Chinese MSS-linked sender",
    personRole: "Claimed Chinese Ministry of State Security",
    whatHappened:
      "Received surveillance photos of my home, car, and children's school taken over weeks, emailed as an attachment with no accompanying text message.",
    howContacted:
      "Email from xf77r@protonmail.com with 14 attached photos and no subject line or body. Showed my morning routine, children's school drop-off, and grocery trips.",
    whatDemanded:
      "Follow-up email two days later: 'We hope you understand what this means. Think carefully about your next article on the Xinjiang detention system.'",
    governmentConnection:
      "Prior email from 'Overseas Chinese Affairs Services' used language mirroring documented Chinese state-linked communications, per research published by Citizen Lab.",
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
      "Person presenting as Chinese Embassy commercial counselor, gave name 'Chen Wei'",
    personDisplayName: "Chen Wei",
    personRole: "Chinese Embassy Commercial Counselor",
    whatHappened:
      "Introduced himself at a business conference, then privately warned me during cocktail hour that my criticism of the Chinese government was 'creating problems' for my relatives.",
    howContacted:
      "In-person at a professional event. He had a Chinese Embassy Economic and Commercial Office business card. Later sent a LinkedIn connection request.",
    whatDemanded:
      "Said relatives' business licenses in Shanghai were 'under review'. Asked me to refrain from testifying at an upcoming USCIRF hearing on Uyghur detainees.",
    governmentConnection:
      "Embassy business card confirmed Chinese government affiliation. His prior knowledge of my private USCIRF invitation suggests intelligence access.",
    evidenceFiles: [
      "business_card_scan.jpg",
      "linkedin_connection_request.png",
    ],
    dangerLevel: "not_immediate_danger",
    whenNote:
      "May 17, 2023, approximately 7:30 PM, at the US-China Business Forum in McLean, VA",
    locationLabel: "McLean, VA",
    region: "washington_dc_metro",
    physicalViolence: "physical_violence_not_used",
  },
  {
    originalId: 133,
    createdAt: "2026-03-27T12:00:00.000Z",
    occurredAt: "2023-08-07T15:00:00.000Z",
    whoTargeted:
      "Unknown actor using tools consistent with Chinese state-aligned cyber operations, per digital forensics",
    personDisplayName: "Chinese state-linked operator",
    personRole: "Suspected Chinese state-aligned cyber operator",
    whatHappened:
      "Phone targeted with a WeChat phishing attack. Clicking the link installed surveillance software that exfiltrated 3 weeks of messages before I discovered it.",
    howContacted:
      "WeChat message from +86-138-555-0173 disguised as a WeChat security verification using official branding. Convinced me to click the link.",
    whatDemanded:
      "After discovery, received a call from a Chinese number: 'We have everything we need. Stay quiet about Tibet matters going forward.'",
    governmentConnection:
      "Digital forensics identified command servers linked to Chinese state-aligned operations in reports published by Citizen Lab.",
    evidenceFiles: [
      "forensic_analysis_report.pdf",
      "wechat_phishing_screenshot.png",
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
      "Person claiming to be from Chinese consular legal affairs; approached my landlord directly",
    personDisplayName: "Chinese consular legal affairs visitor",
    personRole: "Claimed Chinese MSS / Consular Legal Affairs",
    whatHappened:
      "My landlord told me a man visited the building claiming to conduct a background investigation on behalf of Chinese authorities, asking about my visitors and schedule.",
    howContacted:
      "Indirect—through my landlord Robert Park, who informed me that evening. The man left a card reading 'Chinese Consulate Legal Affairs'.",
    whatDemanded:
      "Told my landlord I was 'wanted for questioning' and that my US status 'may be affected by outstanding Chinese legal matters'. Left a callback number.",
    governmentConnection:
      "Card referenced Chinese Consulate Legal Affairs. The phone number connects to a line at the Chinese Consulate per public consular directory listings.",
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
      "Pro-Beijing troll network; primary operator reached out from Telegram account @huaxia_voice_official",
    personDisplayName: "@huaxia_voice_official",
    personRole: "Pro-Beijing troll network operator",
    whatHappened:
      "Sustained 3-month harassment campaign targeting my journalism. Network reported my accounts with false claims, resulting in two temporary platform suspensions.",
    howContacted:
      "Harassment across Twitter/X, Telegram, and email. @huaxia_voice_official sent DMs including my home neighborhood and physical description.",
    whatDemanded:
      "'Every journalist who lies about China is held accountable. We know your neighborhood. Keep writing and find out what accountability looks like.'",
    governmentConnection:
      "The coordinating Telegram channel is documented as part of a Chinese state-linked information operation by the Australian Strategic Policy Institute. Chinese Foreign Ministry spokespersons amplified content.",
    evidenceFiles: [
      "telegram_message_screenshots.zip",
      "aspi_report_excerpt.pdf",
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
      "Two men posing as a community ride, later revealing ties to the Chinese Ministry of State Security",
    personDisplayName: "Two MSS-linked men",
    personRole: "Chinese Ministry of State Security (MSS)",
    whatHappened:
      "What I believed was a friendly ride from JFK became a 40-minute interrogation about my work exposing CCP corruption, using details only from my private communications.",
    howContacted:
      "Arranged by a trusted community member (name withheld). The ride was offered as a favor. I had no reason to suspect malicious intent beforehand.",
    whatDemanded:
      "Claimed MSS had shared my file with Interpol via a fraudulent red notice. Offered a 'path forward' if I handed over source materials and unpublished reporting on the Xinjiang labor system.",
    governmentConnection:
      "Identified themselves as MSS at the end of the ride. Knew details of internal CCP communications referencing the Politburo.",
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
