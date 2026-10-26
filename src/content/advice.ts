// DRAFT — to be reviewed and replaced by the sleep coach
//
// All sleep advice lives in this file as plain data: schedules, tips, safe-sleep
// reminders and the step-by-step help flows. Components only read it.
// Numbers are ranges based on widely accepted guidance (AASM / AAP sleep
// durations, safe-sleep recommendations). Times are in minutes unless noted.

import type { HelpFlowId } from '../data/types';

export type AgeBand = '0-3m' | '4-6m' | '7-12m' | '1-2y' | '2-4y' | '4y+';

export const ageBands: { id: AgeBand; label: string; fromMonths: number; toMonths: number }[] = [
  { id: '0-3m', label: '0–3 mánaða', fromMonths: 0, toMonths: 4 },
  { id: '4-6m', label: '4–6 mánaða', fromMonths: 4, toMonths: 7 },
  { id: '7-12m', label: '7–12 mánaða', fromMonths: 7, toMonths: 12 },
  { id: '1-2y', label: '1–2 ára', fromMonths: 12, toMonths: 24 },
  { id: '2-4y', label: '2–4 ára', fromMonths: 24, toMonths: 48 },
  { id: '4y+', label: '4 ára og eldri', fromMonths: 48, toMonths: 145 },
];

export interface ScheduleRow {
  /** inclusive, in (corrected) months */
  fromMonths: number;
  /** exclusive */
  toMonths: number;
  /** naps per day used for planning (0 = no naps) */
  naps: number;
  /** how naps are described to parents, e.g. "3–4 blundir" */
  napsLabel: string;
  /** awake time between sleeps [shortest, longest], first window of the day is the shortest */
  wakeWindow: [number, number];
  /** typical nap length [min, max] */
  napLength: [number, number];
  /** total sleep per 24 h in hours */
  totalSleep: [number, number];
  /** usual bedtime range HH:MM */
  bedtime: [string, string];
}

export const schedules: ScheduleRow[] = [
  { fromMonths: 0, toMonths: 1, naps: 5, napsLabel: '4–6 blundir', wakeWindow: [35, 60], napLength: [30, 120], totalSleep: [14, 17], bedtime: ['20:30', '22:30'] },
  { fromMonths: 1, toMonths: 2, naps: 5, napsLabel: '4–5 blundir', wakeWindow: [45, 75], napLength: [30, 120], totalSleep: [14, 17], bedtime: ['20:00', '22:00'] },
  { fromMonths: 2, toMonths: 3, naps: 4, napsLabel: '4–5 blundir', wakeWindow: [60, 90], napLength: [30, 120], totalSleep: [14, 17], bedtime: ['19:30', '21:30'] },
  { fromMonths: 3, toMonths: 5, naps: 4, napsLabel: '3–4 blundir', wakeWindow: [75, 120], napLength: [30, 90], totalSleep: [12, 16], bedtime: ['19:00', '20:30'] },
  { fromMonths: 5, toMonths: 7, naps: 3, napsLabel: '3 blundir', wakeWindow: [120, 150], napLength: [30, 90], totalSleep: [12, 16], bedtime: ['18:30', '20:00'] },
  { fromMonths: 7, toMonths: 9, naps: 2, napsLabel: '2–3 blundir', wakeWindow: [150, 195], napLength: [45, 90], totalSleep: [12, 16], bedtime: ['18:30', '19:45'] },
  { fromMonths: 9, toMonths: 12, naps: 2, napsLabel: '2 blundir', wakeWindow: [180, 240], napLength: [45, 90], totalSleep: [12, 16], bedtime: ['18:30', '19:30'] },
  { fromMonths: 12, toMonths: 15, naps: 2, napsLabel: '1–2 blundir', wakeWindow: [195, 270], napLength: [45, 90], totalSleep: [11, 14], bedtime: ['18:30', '19:30'] },
  { fromMonths: 15, toMonths: 24, naps: 1, napsLabel: '1 blundur', wakeWindow: [300, 360], napLength: [90, 150], totalSleep: [11, 14], bedtime: ['18:45', '20:00'] },
  { fromMonths: 24, toMonths: 36, naps: 1, napsLabel: '1 blundur', wakeWindow: [300, 390], napLength: [60, 120], totalSleep: [11, 14], bedtime: ['19:00', '20:00'] },
  { fromMonths: 36, toMonths: 48, naps: 1, napsLabel: '0–1 blundur', wakeWindow: [360, 420], napLength: [45, 90], totalSleep: [10, 13], bedtime: ['19:00', '20:00'] },
  { fromMonths: 48, toMonths: 72, naps: 0, napsLabel: 'Engir blundir', wakeWindow: [720, 780], napLength: [0, 0], totalSleep: [10, 13], bedtime: ['19:00', '20:00'] },
  { fromMonths: 72, toMonths: 108, naps: 0, napsLabel: 'Engir blundir', wakeWindow: [720, 840], napLength: [0, 0], totalSleep: [9, 12], bedtime: ['19:30', '20:30'] },
  { fromMonths: 108, toMonths: 145, naps: 0, napsLabel: 'Engir blundir', wakeWindow: [720, 840], napLength: [0, 0], totalSleep: [9, 12], bedtime: ['20:00', '21:00'] },
];

/** Detailed nap scheduling only up to this age; older children get bedtime + routine guidance. */
export const detailedNapsUntilMonths = 48;

export const rules = {
  /** evening routine length before bedtime */
  routineMinutes: 30,
  /** show "routine starts in X min" this long before the routine */
  routineSoonMinutes: 60,
  /** a logged nap shorter than this counts as a short nap */
  shortNapMinutes: 40,
  /** bedtime moves this much earlier after a short nap */
  shortNapBedtimeEarlier: 20,
  /** bedtime moves this much earlier after a missed nap */
  missedNapBedtimeEarlier: 45,
  /** bedtime is never moved earlier than (earliest usual bedtime − this) */
  maxEarlierThanUsual: 60,
  /** night theme turns on this long before bedtime */
  nightThemeBeforeBedtime: 30,
  /** local reminder this long before the routine starts */
  reminderBeforeRoutine: 15,
};

export const defaultRoutine = ['Bað', 'Náttföt', 'Mjólk / peli', 'Saga', 'Ljósin slökkt'];

export const disclaimer = 'Almennar ráðleggingar, koma ekki í stað læknisráða.';

export const safeSleep = {
  title: 'Öruggur svefn',
  points: [
    'Leggðu barnið alltaf á bakið til að sofa.',
    'Í eigin rúmi á flötu, stífu undirlagi.',
    'Ekkert laust í rúminu: engir koddar, sængur, stuðkantar eða leikföng.',
    'Hæfilegur hiti í herberginu og enginn reykur í kringum barnið.',
  ],
};

export const doctorNote = {
  title: 'Hvenær á að leita til læknis',
  intro: 'Hafðu samband við heilsugæsluna ef barnið:',
  points: [
    'er með hita, sérstaklega ef það er yngra en 3 mánaða',
    'á erfitt með andardrátt eða andar óvenjulega',
    'vill ekki drekka eða borða, eða bleiur eru færri en venjulega',
    'grætur á óvenjulegan hátt eða er óvenju slappt',
  ],
  worried: 'Og alltaf ef þú hefur áhyggjur. Þú þekkir barnið þitt best.',
  heilsuvera: 'Heilsuvera.is eða síminn 1700, opinn allan sólarhringinn.',
  emergency: 'Í neyð: hringdu í 112.',
};

export const tips: Record<AgeBand, string[]> = {
  '0-3m': [
    'Á þessum aldri er enginn fastur dagskrártími. Fylgdu þreytumerkjum: geispa, stara út í loftið, nudda augun.',
    'Dagsbirta á morgnana og dimma á kvöldin hjálpa líkamsklukkunni að mótast.',
    'Það er í lagi að barnið sofni í fanginu. Þú getur ekki „vanið“ svona ungt barn á neitt slæmt.',
    'Lágt suðhljóð (white noise) getur hjálpað barninu að slaka á.',
    'Hvíldu þig þegar barnið sefur ef þú getur. Svefninn þinn skiptir líka máli.',
  ],
  '4-6m': [
    'Stutt og eins kvöldrútína á hverju kvöldi gefur barninu merki um að nóttin sé að koma.',
    'Prófaðu að leggja barnið syfjað en vakandi af og til, án þess að það þurfi að takast.',
    'Morgunbirta og útivera á daginn hjálpa nætursvefninum.',
    'Algengt er að svefn breytist um 4 mánaða aldur. Það gengur yfir.',
  ],
  '7-12m': [
    'Hafðu tímann sem barnið vaknar á morgnana nokkuð fastan, það heldur deginum í rytma.',
    'Aðskilnaðarkvíði er algengur á þessum aldri. Leikir eins og „hvar er…“ á daginn geta hjálpað.',
    'Gefðu barninu tækifæri til að æfa nýja hreyfifærni á daginn, þá truflar hún síður á nóttunni.',
    'Settu síðustu mjólkina fyrr í rútínuna, áður en þið burstið tennur og lesið.',
  ],
  '1-2y': [
    'Skjálaus klukkustund fyrir háttatíma hjálpar barninu að róast.',
    'Gefðu barninu val sem skiptir litlu: hvor náttfötin, hvaða bók.',
    'Blundurinn ætti helst að klárast fyrir kl. 15:30 svo barnið sé tilbúið í háttinn.',
    'Eitt uppáhalds tuskudýr getur orðið góður svefnfélagi.',
  ],
  '2-4y': [
    'Myndrænt rútínuspjald (bað, náttföt, tennur, bók) gerir kvöldið fyrirsjáanlegt.',
    'Svefnklukka sem breytir um lit á morgnana kennir hvenær má fara á fætur.',
    'Ef blundurinn ýtir háttatíma seint, prófaðu að stytta hann frekar en að sleppa honum strax.',
    'Hrós og jákvæð athygli fyrir að vera í rúminu virka betur en skammir.',
  ],
  '4y+': [
    'Fastur háttatími, líka um helgar (innan við klukkustund), heldur svefninum góðum.',
    'Engir skjáir í svefnherberginu og helst ekki síðustu klukkustundina fyrir svefn.',
    'Rólegt spjall um daginn við háttinn gefur rými fyrir áhyggjur áður en ljósin slokkna.',
    'Hreyfing og útivera á daginn hjálpa barninu að sofna á kvöldin.',
  ],
};

export interface HelpStep {
  title: string;
  text: string;
  /** optional wait timer in minutes */
  waitMinutes?: number;
}

export interface HelpFlow {
  id: HelpFlowId;
  title: string;
  subtitle: string;
  /** opening this flow recalculates the rest of today */
  adjustsToday?: 'missedNap' | 'shortNap';
  steps: Record<AgeBand, HelpStep[]>;
}

const backToSleepSafe: HelpStep = {
  title: 'Leggðu barnið aftur á bakið',
  text: 'Í eigið rúm, á flatt og stíft undirlag, ekkert laust í rúminu. Ef það vaknar aftur byrjarðu bara upp á nýtt. Þú ert ekki að gera neitt rangt.',
};

export const helpFlows: HelpFlow[] = [
  {
    id: 'nightWaking',
    title: 'Vaknar á nóttunni',
    subtitle: 'Róleg skref til að hjálpa barninu aftur að sofa',
    steps: {
      '0-3m': [
        { title: 'Athugaðu grunnþarfirnar', text: 'Er barnið svangt, með blauta bleiu, of heitt eða of kalt? Á þessum aldri er eðlilegt og nauðsynlegt að vakna til að drekka.' },
        { title: 'Gefðu að drekka ef það er svangt', text: 'Hafðu ljósin dimm og talaðu lágt. Næturgjafir eru rólegar og stuttar, ekki leiktími.' },
        { title: 'Róaðu með nærveru', text: 'Vaggaðu, sussaðu eða haltu barninu að þér þar til það róast. Það er í lagi að það sofni í fanginu.' },
        backToSleepSafe,
      ],
      '4-6m': [
        { title: 'Hlustaðu andartak', text: 'Börn umla og hreyfa sig mikið í svefni. Hlustaðu í smástund áður en þú ferð inn. Ef gráturinn eykst ferðu strax til barnsins.', waitMinutes: 1 },
        { title: 'Athugaðu grunnþarfirnar', text: 'Hungur, bleia, hiti. Gefðu að drekka ef barnið er svangt, í dimmu og rólegu.' },
        { title: 'Róaðu rólega', text: 'Hönd á bringuna, lágt suss eða raul. Taktu barnið upp ef það þarf. Hafðu ljósin slökkt.' },
        backToSleepSafe,
      ],
      '7-12m': [
        { title: 'Bíddu og hlustaðu', text: 'Gefðu barninu nokkrar mínútur til að reyna að sofna sjálft aftur. Ef gráturinn eykst ferðu inn.', waitMinutes: 3 },
        { title: 'Farðu inn rólega', text: 'Ekki kveikja ljósin. Segðu sömu rólegu setninguna í hvert skipti, t.d. „Það er nótt, þú mátt sofa.“' },
        { title: 'Róaðu í rúminu', text: 'Hönd á bakið eða bringuna og suss. Reyndu að hjálpa barninu í rúminu frekar en að taka það upp.', waitMinutes: 3 },
        { title: 'Farðu út áður en það sofnar', text: 'Þegar barnið er orðið rólegt en vakandi ferðu út. Ef það grætur aftur endurtekurðu skrefin á undan.' },
      ],
      '1-2y': [
        { title: 'Bíddu og hlustaðu', text: 'Stundum er þetta bara umbreyting milli svefnhringja. Gefðu barninu smá tíma.', waitMinutes: 3 },
        { title: 'Farðu inn og fullvissaðu', text: 'Stutt, rólegt og frekar leiðinlegt: „Það er nótt. Ég er hérna. Nú sofum við.“' },
        { title: 'Hjálpaðu barninu að leggjast', text: 'Ef barnið stendur upp leggurðu það rólega niður aftur. Ekkert spjall eða leikföng.' },
        { title: 'Sittu nálægt', text: 'Sittu á stól við rúmið þar til barnið sofnar. Næstu nætur færirðu stólinn smám saman nær hurðinni.' },
      ],
      '2-4y': [
        { title: 'Farðu inn rólega', text: 'Stutt og kunnuglegt: „Það er nótt. Ég er hérna. Nú sofum við.“' },
        { title: 'Ein þörf í einu', text: 'Vatnssopi, klósett eða knús. Eitt í einu og svo aftur upp í rúm.' },
        { title: 'Leiddu aftur í rúmið', text: 'Ef barnið kemur fram leiðirðu það rólega til baka, með fáum orðum. Alltaf eins, eins oft og þarf.' },
        { title: 'Hrósaðu í fyrramálið', text: 'Talaðu jákvætt um nóttina og hrósaðu fyrir að vera í rúminu. Límmiðaspjald getur hjálpað.' },
      ],
      '4y+': [
        { title: 'Hlustaðu á áhyggjurnar', text: 'Vaknaði barnið af draumi eða hræðslu? Viðurkenndu tilfinninguna stuttlega og rólega.' },
        { title: 'Haltu því stuttu', text: 'Fylgdu barninu aftur í rúmið. Lítið næturljós er í lagi, skjáir ekki.' },
        { title: 'Róið ykkur saman', text: 'Andið saman: inn á meðan þið teljið upp í 4, út upp í 6. Uppáhaldsbangsi eða róleg hljóðbók hjálpar líka.', waitMinutes: 3 },
        { title: 'Gerið plan á morgun', text: 'Talið saman að degi til um hvað hjálpar ef barnið vaknar, t.d. „næturplan“ með myndum.' },
      ],
    },
  },
  {
    id: 'wontSleep',
    title: 'Vill ekki sofna',
    subtitle: 'Þegar svæfingin dregst á langinn',
    steps: {
      '0-3m': [
        { title: 'Leitaðu að þreytumerkjum', text: 'Geispi, starandi augnaráð, nudd í augun. Ef barnið hefur verið lengi vakandi getur það verið yfirþreytt og átt erfiðara með að sofna.' },
        { title: 'Minnkaðu áreiti', text: 'Dimmt herbergi, lágt suðhljóð og fá orð.' },
        { title: 'Róaðu á þann hátt sem virkar', text: 'Vöggun, suss, snuð, brjóst eða pela. Það er í lagi að hjálpa barninu að sofna.', waitMinutes: 5 },
        { title: 'Taktu hlé ef ekkert gengur', text: 'Farðu fram í rólega stund og reyndu aftur eftir 10–15 mínútur. Leggðu barnið alltaf á bakið í eigið rúm.' },
      ],
      '4-6m': [
        { title: 'Athugaðu vökutímann', text: 'Á þessum aldri er barnið venjulega tilbúið að sofna eftir 1½–2½ klst vöku. Of stuttur vökutími getur líka gert svæfinguna erfiða.' },
        { title: 'Stutt og eins rútína', text: 'Bleia, svefnpoki, lag og ljósin slökkt. Sama röðin í hvert sinn.' },
        { title: 'Hjálpaðu barninu að slaka á', text: 'Prófaðu að leggja það syfjað en vakandi. Ef það gengur ekki er alveg í lagi að vagga eða halda á.', waitMinutes: 5 },
        { title: 'Taktu hlé ef ekkert gengur', text: 'Farðu fram í 10 mínútur, rólegur leikur í dimmu, og reyndu svo aftur.' },
      ],
      '7-12m': [
        { title: 'Athugaðu vökutímann', text: 'Of stuttur vökutími: barnið er ekki nógu þreytt. Of langur: það verður yfirþreytt. Skoðaðu áætlunina á Í dag.' },
        { title: 'Haltu rútínunni eins', text: 'Sama röð, sömu orð. Endaðu alltaf á sama hátt, t.d. með sama laginu.' },
        { title: 'Leggðu barnið í rúmið vakandi', text: 'Gefðu því tækifæri til að finna svefninn sjálft. Vertu nálægt.', waitMinutes: 3 },
        { title: 'Róaðu og dragðu þig í hlé', text: 'Ef barnið grætur róarðu það í rúminu, stutt og rólega, og ferð svo aftur fram. Endurtaktu eftir þörfum.' },
      ],
      '1-2y': [
        { title: 'Skoðaðu daginn', text: 'Var blundurinn seinn eða langur? Barnið þarf að hafa verið vakandi í 4½–6 klst fyrir háttatíma.' },
        { title: 'Róleg rútína án skjáa', text: 'Dempuð ljós, bað, bók. Engir skjáir síðustu klukkustundina.' },
        { title: 'Sama kveðjan', text: 'Notaðu alltaf sömu góðanóttkveðjuna. Hún verður merki um að nú sé svefninn kominn.' },
        { title: 'Sittu nálægt', text: 'Sittu rólega við rúmið án þess að spjalla. Næstu kvöld færirðu þig smám saman fjær.', waitMinutes: 5 },
      ],
      '2-4y': [
        { title: 'Skoðaðu blundinn', text: 'Langur eða seinn blundur getur ýtt háttatímanum seint. Prófaðu að stytta hann.' },
        { title: 'Gefðu val', text: 'Tvö lítil val (hvor náttfötin, hvaða bók) gefa barninu stjórn án þess að lengja kvöldið.' },
        { title: 'Skýr mörk', text: '„Ein bók, eitt lag, svo ljósin.“ Segðu það áður en rútínan byrjar og haltu þig við það.' },
        { title: 'Leiddu aftur í rúmið', text: 'Ef barnið kemur fram leiðirðu það rólega til baka með fáum orðum. Eins í hvert skipti.' },
      ],
      '4y+': [
        { title: 'Slökun', text: 'Teygjur, djúp öndun eða „líkamsskönnun“: slaka á tánum, fótunum, maganum…', waitMinutes: 3 },
        { title: 'Áhyggjur fyrr um kvöldið', text: 'Ef hugurinn er á fullu, takið stutta „áhyggjustund“ fyrir rútínuna og skrifið eða teiknið það sem truflar.' },
        { title: 'Lestur í rúminu', text: 'Leyfðu rólegan lestur í 10–15 mínútur við dauft ljós.' },
        { title: 'Ef svefninn kemur ekki', text: 'Eftir 20–30 mínútur má fara fram í rólega stund og prófa svo aftur. Ekki skjáir.' },
      ],
    },
  },
  {
    id: 'shortNap',
    title: 'Blundurinn var of stuttur',
    subtitle: 'Við aðlögum restina af deginum',
    adjustsToday: 'shortNap',
    steps: {
      '0-3m': [
        { title: 'Stuttir blundir eru algengir', text: 'Blundir upp á 30–45 mínútur eru eðlilegir á þessum aldri. Þetta lagast með tímanum.' },
        { title: 'Reyndu að lengja blundinn', text: 'Ef barnið umlar, prófaðu að róa það strax með hönd, suss eða snuði áður en það vaknar alveg.', waitMinutes: 5 },
        { title: 'Ef það vaknar alveg', text: 'Byrjaðu nýjan vökutíma. Næsti blundur kemur aðeins fyrr, fylgdu þreytumerkjum.' },
        { title: 'Blundur á ferð er í lagi', text: 'Vagn, burðarpoki eða fang. Það skiptir ekki máli hvar barnið sefur á daginn, svo lengi sem það er öruggt.' },
      ],
      '4-6m': [
        { title: 'Hlustaðu andartak', text: 'Barnið getur sofnað aftur. Ef það grætur ferðu inn.', waitMinutes: 2 },
        { title: 'Róaðu í rúminu', text: 'Hönd á bringuna, suss og dimmt herbergi. Taktu barnið upp ef það róast ekki.' },
        { title: 'Næsti blundur fyrr', text: 'Við höfum stytt næsta vökutíma og fært háttatímann aðeins fram á Í dag.' },
      ],
      '7-12m': [
        { title: 'Bíddu aðeins', text: 'Gefðu barninu tækifæri til að sofna aftur sjálft.', waitMinutes: 5 },
        { title: 'Farðu inn og róaðu', text: 'Í rúminu, rólega og stutt. Ef barnið er glaðvakandi eftir 10–15 mínútur er blundurinn búinn.' },
        { title: 'Styttri vökutími næst', text: 'Við höfum fært næsta blund og háttatíma aðeins fram á Í dag.' },
        { title: 'Myrkur og hljóð', text: 'Dimmt herbergi og suðhljóð í næsta blundi geta hjálpað barninu að tengja saman svefnhringi.' },
      ],
      '1-2y': [
        { title: 'Bíddu aðeins', text: 'Barnið gæti sofnað aftur ef það fær frið.', waitMinutes: 5 },
        { title: 'Róleg stund í rúminu', text: 'Leyfðu barninu að vera í rúminu 10–15 mínútur í viðbót, jafnvel þótt það sofni ekki.' },
        { title: 'Fyrr í háttinn', text: 'Bættu ekki upp með seinum blundi. Við höfum fært háttatímann fram á Í dag.' },
      ],
      '2-4y': [
        { title: 'Hvíldarstund', text: 'Róleg stund í rúminu með bók eða hljóðbók gefur hvíld þótt barnið sofi ekki.' },
        { title: 'Fyrr í háttinn', text: 'Við höfum fært háttatímann aðeins fram á Í dag.' },
        { title: 'Er blundurinn að hverfa?', text: 'Ef barnið sefur vel á nóttunni án blunds gæti verið kominn tími á hvíldarstund í staðinn.' },
      ],
      '4y+': [
        { title: 'Róleg stund', text: 'Á þessum aldri eru blundir sjaldgæfir. Róleg stund með bók hjálpar ef barnið er þreytt.' },
        { title: 'Fyrr í háttinn ef þarf', text: 'Ef barnið er mjög þreytt má byrja kvöldrútínuna aðeins fyrr.' },
      ],
    },
  },
  {
    id: 'missedNap',
    title: 'Við misstum af blundi',
    subtitle: 'Það gerist. Við endurreiknum daginn',
    adjustsToday: 'missedNap',
    steps: {
      '0-3m': [
        { title: 'Ekkert mál', text: 'Börn á þessum aldri sofna oft þegar þau þreytast næst. Fylgdu þreytumerkjum.' },
        { title: 'Hjálpaðu barninu að sofna', text: 'Vagn, burðarpoki eða fang eru í lagi. Haltu því öruggu og fylgstu með.' },
        { title: 'Næsti blundur fyrr', text: 'Við höfum uppfært áætlunina á Í dag.' },
      ],
      '4-6m': [
        { title: 'Reyndu bjargblund', text: 'Stuttur blundur, 20–30 mínútur, í vagni eða fangi hjálpar barninu að komast að kvöldi.' },
        { title: 'Fyrr í háttinn', text: 'Við höfum fært háttatímann fram á Í dag.' },
        { title: 'Róleg kvöldrútína', text: 'Dempaðu ljós og hljóð snemma. Þreytt barn þarf meiri ró.' },
      ],
      '7-12m': [
        { title: 'Reyndu bjargblund', text: 'Ef meira en 1½ klst er í háttatíma: stuttur blundur, 20–30 mínútur, í vagni eða bíl.' },
        { title: 'Fyrr í háttinn', text: 'Við höfum fært háttatímann fram á Í dag.' },
        { title: 'Minna áreiti', text: 'Rólegur leikur seinnipartinn, ekki fjölmenni eða hávaði.' },
      ],
      '1-2y': [
        { title: 'Reyndu bjargblund', text: 'Stuttur blundur í bíl eða vagni, 20–30 mínútur, ef klukkan er ekki orðin 16.' },
        { title: 'Fyrr í háttinn', text: 'Við höfum fært háttatímann fram á Í dag, allt að klukkutíma fyrr er í lagi.' },
        { title: 'Rólegt seinnipartinn', text: 'Útivera og rólegur leikur. Þreytt barn verður oft ofvirkt, það er eðlilegt.' },
      ],
      '2-4y': [
        { title: 'Hvíldarstund', text: 'Róleg stund með bók eða hljóðbók í 20 mínútur, jafnvel þótt barnið sofni ekki.' },
        { title: 'Fyrr í háttinn', text: 'Við höfum fært háttatímann fram á Í dag.' },
        { title: 'Ekki blundur seint', text: 'Forðastu að barnið sofni eftir kl. 16, t.d. í bílnum. Það ýtir háttatímanum seint.' },
      ],
      '4y+': [
        { title: 'Rólegt seinnipartinn', text: 'Á þessum aldri eru blundir sjaldgæfir. Róleg stund hjálpar ef barnið er þreytt.' },
        { title: 'Fyrr í háttinn ef þarf', text: 'Byrjaðu kvöldrútínuna aðeins fyrr ef barnið er mjög þreytt.' },
      ],
    },
  },
  {
    id: 'earlyWaking',
    title: 'Vaknaði of snemma',
    subtitle: 'Fyrir kl. 6 er enn nótt',
    steps: {
      '0-3m': [
        { title: 'Algengt á þessum aldri', text: 'Líkamsklukkan er enn að mótast. Gefðu að drekka í myrkri og haltu morgninum rólegum.' },
        { title: 'Reyndu að svæfa aftur', text: 'Vöggun, suss og dimmt herbergi. Ef það gengur ekki byrjar dagurinn bara, það er í lagi.' },
        { title: 'Birta á morgnana', text: 'Þegar dagurinn byrjar: dagsbirta og útivera hjálpa líkamsklukkunni.' },
      ],
      '4-6m': [
        { title: 'Komdu fram við það sem nótt', text: 'Fyrir kl. 6: dimmt, rólegt, gjöf ef barnið er svangt, aftur í rúmið.' },
        { title: 'Myrkur', text: 'Myrkvunargardínur hjálpa mikið þegar birtir snemma, sérstaklega á íslensku sumri.' },
        { title: 'Skoðaðu kvöldið', text: 'Of seinn háttatími eða of langur síðasti vökutími getur valdið snemmbúnum vöknunum.' },
      ],
      '7-12m': [
        { title: 'Komdu fram við það sem nótt', text: 'Fyrir kl. 6: ekki kveikja ljós, fá orð, ekki byrja daginn.' },
        { title: 'Bíddu og hlustaðu', text: 'Gefðu barninu tækifæri til að sofna aftur.', waitMinutes: 5 },
        { title: 'Byrjaðu daginn á sama tíma', text: 'Þegar dagurinn byrjar: ljósin kveikt, gardínur frá, morgunmatur. Sami tími á hverjum morgni.' },
        { title: 'Ekki of snemma í blund', text: 'Ef fyrsti blundur er mjög snemma verður hann „framhald af nóttinni“. Teygðu hann smám saman.' },
      ],
      '1-2y': [
        { title: 'Komdu fram við það sem nótt', text: 'Fyrir kl. 6: dimmt, rólegt og „það er enn nótt“.' },
        { title: 'Bíddu og hlustaðu', text: 'Sum börn spjalla smá og sofna aftur.', waitMinutes: 5 },
        { title: 'Skoðaðu blundinn', text: 'Of langur eða of snemmbúinn blundur getur ýtt undir snemmbúnar vöknur.' },
        { title: 'Myrkur og sami tími', text: 'Myrkvunargardínur og sami fótaferðatími á hverjum degi.' },
      ],
      '2-4y': [
        { title: 'Svefnklukka', text: 'Klukka sem breytir um lit þegar má fara á fætur kennir barninu að bíða.' },
        { title: 'Leiddu aftur í rúmið', text: 'Rólega og með fáum orðum: „Klukkan er ekki orðin græn.“' },
        { title: 'Hrósaðu', text: 'Hrósaðu fyrir að bíða eftir klukkunni, jafnvel þótt barnið hafi verið vakandi.' },
      ],
      '4y+': [
        { title: 'Svefnklukka eða úr', text: 'Ákveðið saman hvenær má fara á fætur og notið klukku sem barnið skilur.' },
        { title: 'Rólegur leikur í herberginu', text: 'Bækur eða rólegur leikur í herberginu þar til tíminn kemur.' },
        { title: 'Skoðaðu kvöldið', text: 'Er barnið að fá nægan svefn? Fastur háttatími hjálpar.' },
      ],
    },
  },
];
