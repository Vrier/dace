// levin_classes.js — Levin subclass definitions for DACE predicates
// Sourced from verb_classes.md. Members lists match exactly.

const VC_L = "docs/verb_classes.html";

window.DACE_LEVIN_CLASSES = {
  "1.1": { label: "Comprehend", sec: "§1.1", short: "Comprehend (1.1)",
    fullName: "Comprehend Verbs",
    ahg: "cognitive",
    url: VC_L + "#11-comprehend-verbs",
    def: "Stative factive verbs expressing an enduring cognitive relation. The subject knows, understands, or is aware of a presupposed fact.",
    levin: "Levin §87.1 / VerbNet comprehend-87",
    members: ["appreciate","be_aware","be_certain","be_conscious","be_convinced","be_sure","be_unaware","comprehend","forget","know","remember","understand","wot"] },

  "1.2": { label: "Discover", sec: "§1.2", short: "Discover (1.2)",
    fullName: "Discover Verbs",
    ahg: "cognitive",
    url: VC_L + "#12-discover-verbs",
    def: "Achievement verbs: the subject comes to know a fact. Semi-factive — the complement is presupposed true at the result state.",
    levin: "Levin §87.2 / VerbNet discover-84",
    members: ["accept","ascertain","catch_on","check","conclude","cotton_on","deduce","detect","determine","diagnose","discern","discover","divine","fathom","figure_out","find","find_out","grasp","identify","ignore","infer","intuit","learn","miss","pick_up","piece_together","realize","recognize","register","rumble","sink_in","suss_out","take_in","twig","verify","work_out"] },

  "1.3": { label: "Conjecture", sec: "§1.3", short: "Conjecture (1.3)",
    fullName: "Conjecture Verbs",
    ahg: "cognitive",
    url: VC_L + "#13-conjecture-verbs",
    def: "Stative non-factive doxastic verbs. The subject takes an epistemic stance without presupposing the complement's truth. Anti-responsive (no interrogative complement). Diagnostic: pro-complement alternation (think so, believe so).",
    levin: "Levin §29.5 / VerbNet conjecture-29.5",
    members: ["assess","assume","be_confident","be_skeptical","be_uncertain","believe","calculate","categorize","conceive","conjecture","consider","contemplate","credit","deem","derive","disbelieve","dismiss","doubt","evaluate","expect","fancy","figure","foresee","gather","gauge","generalize","guess","hallucinate","investigate","judge","make_out","measure","muse","ponder","posit","presuppose","reason","reason_out","reckon","recollect","reconsider","rediscover","ruminate","suppose","surmise","suspect","theorize","think","trow","trust","visualize","ween"] },

  "1.4": { label: "Imagine", sec: "§1.4", short: "Imagine (1.4)",
    fullName: "Imagine Verbs",
    ahg: "imaginative",
    url: VC_L + "#14-imagine-verbs",
    def: "Verbs of imaginative or fictive engagement. The subject entertains a non-actual scenario without commitment to its truth. Counter-factive (pretend) or non-factive (imagine, dream).",
    levin: "No established Levin class; closest VerbNet consider-29.9",
    members: ["daydream","dream","fantasize","imagine","pretend"] },

  "2.1": { label: "Regret", sec: "§2.1", short: "Regret (2.1)",
    fullName: "Regret Verbs (Factive Emotive)",
    ahg: "emotive",
    url: VC_L + "#21-regret-verbs-factive-emotive",
    def: "Factive subject-experiencer verbs expressing an affective attitude toward a true fact. Diagnostic: gerund complement (regret lying).",
    levin: "Levin §31.2 / VerbNet admire-31.2",
    members: ["abhor","be_annoyed","be_ashamed","be_delighted","be_disappointed","be_excited","be_glad","be_happy","be_horrified","be_hurt","be_irritated","be_outraged","be_pleased","be_proud","be_relieved","be_sad","be_satisfied","be_sorry","be_surprised","be_thankful","be_thrilled","be_upset","bemoan","bewail","bristle","deplore","despise","detest","dislike","enjoy","envy","exult","flip_out","freak_out","fuss","gloat","groan","grumble","hate","lament","like","loathe","love","marvel","mind","mourn","overlook","panic","pout","regret","rejoice","relish","resent","rue","savour","seethe","wail","welcome"] },

  "2.2": { label: "Fear", sec: "§2.2", short: "Fear (2.2)",
    fullName: "Fear Verbs (Non-Factive Emotive)",
    ahg: "emotive",
    url: VC_L + "#22-fear-verbs-non-factive-emotive",
    def: "Non-factive subject-experiencer emotive verbs. The subject has a prospective or evaluatively uncommitted affective attitude toward a proposition that may not obtain.",
    levin: "Levin §31.2 (non-factive subset)",
    members: ["agonize","be_afraid","be_angry","be_furious","be_jealous","be_mad","be_worried","celebrate","complain","cringe","despair","disdain","disregard","dread","fear","fret","fume","grieve","moan","pray","scoff","sigh","worry"] },

  "3.1": { label: "Amuse", sec: "§3.1", short: "Amuse (3.1)",
    fullName: "Amuse Verbs (Psych Causative)",
    ahg: "psych",
    url: VC_L + "#31-amuse-verbs-psych-causative",
    def: "Factive object-experiencer psych-causative verbs. A stimulus subject causes a psychological state in an experiencer object. Obligatory extraposition in active voice; diagnostic factive passive (she was surprised that…).",
    levin: "Levin §31.1 / VerbNet amuse-31.1",
    members: ["abash","affront","aggravate","agitate","alarm","alienate","amaze","amuse","anger","anguish","annoy","antagonize","appall","appease","arouse","astonish","astound","awe","baffle","befuddle","bewilder","boggle","bore","bug","calm","captivate","chagrin","charm","cheer","chill","comfort","concern","confound","confuse","content","crush","daunt","daze","dazzle","deject","delight","demoralize","depress","devastate","disappoint","disarm","discomfit","disconcert","discourage","disgrace","disgruntle","disgust","dishearten","disillusion","dismay","dispirit","displease","disquiet","dissatisfy","distress","disturb","dumbfound","dupe","elate","electrify","embarrass","embitter","embolden","enchant","encourage","enrage","enrapture","entertain","enthrall","enthuse","entrance","exasperate","excite","exhilarate","fascinate","faze","flabbergast","flatter","floor","fluster","frighten","frustrate","gall","galvanize","gladden","gratify","haunt","hearten","horrify","humble","hurt","impress","incense","infuriate","inspire","interest","intimidate","intrigue","invigorate","irk","irritate","jade","jar","madden","mesmerize","miff","mortify","move","mystify","nauseate","nettle","nonplus","offend","outrage","overwhelm","pain","perplex","petrify","please","puzzle","rankle","relieve","repel","revolt","rile","sadden","satisfy","scare","shame","shock","sicken","soothe","spellbind","spook","startle","stimulate","stun","stupefy","surprise","tantalize","terrify","thrill","tire","torment","torture","traumatize","trouble","unnerve","unsettle","upset","vex","wow"] },

  "4.1": { label: "Say", sec: "§4.1", short: "Say (4.1)",
    fullName: "Say Verbs (Assertive Report)",
    ahg: "communicative",
    url: VC_L + "#41-say-verbs-assertive-report",
    def: "Non-factive assertive communicative verbs. A speaking agent communicates propositional content. Largest class. Diagnostic: quotative alternation (direct speech).",
    levin: "Levin §37.7 / VerbNet say-37.7, manner_speaking-37.3",
    members: ["add","address","adjudge","admonish","advertise","affirm","agree","allege","announce","answer","argue","articulate","assert","asseverate","attest","authorize","aver","avow","babble","bark","beam","bellow","bet","bicker","bitch","blog","blurt_out","boast","brag","bring_up","broadcast","cackle","certify","challenge","chant","charge","chatter","chide","choke_out","chronicle","circulate","claim","clarify","comment","communicate","compute","concede","confess","contend","contest","convey","corroborate","crow","cry","debate","deceive","declaim","declare","decree","denounce","deny","depict","describe","dictate","disagree","discuss","dispel","display","dispute","divulge","drawl","educate","elaborate","email","embellish","emphasize","endorse","ensure","envision","establish","estimate","exclaim","exhibit","explain","expose","express","fax","forecast","foretell","gab","get_around","get_out","giggle","go_around","gossip","grant","growl","grunt","guarantee","gush","hint","hiss","hold","holler","hoot","howl","hush_up","imply","indicate","indict","insinuate","insist","intercept","interject","intimate","jest","joke","lay_out","leak","lecture","log","maintain","mark","mention","moralize","mumble","murmur","mutter","narrate","negotiate","note","object","obsess","omit","opine","ordain","pester","petition","phone","picture","pinpoint","plead","post","praise","preach","predict","prejudge","presume","proclaim","profess","prophesy","propose","protest","publicize","publish","put_about","put_across","quarrel","question","quip","quote","radio","rant","rationalize","rave","read","reaffirm","reassert","recall","recant","recap","recommend","record","reiterate","reject","relate","remark","reminisce","repeat","reply","report","represent","repress","research","respond","restate","retort","rule","say","scream","scribble","select","shout","showcase","shriek","signify","simulate","sing","sketch","snap","snarl","snitch","snort","sob","specify","spell_out","splutter","spout","squeal","stammer","state","stipulate","stutter","submit","suggest","summarize","tease","test","testify","thunder","tweet","type","uncover","underestimate","underline","underscore","update","uphold","utter","venture","videotape","voice","volunteer","vote","wager","warrant","whimper","whisper","will","write","yell"] },

  "4.2": { label: "Tell", sec: "§4.2", short: "Tell (4.2)",
    fullName: "Tell Verbs (Report-To)",
    ahg: "communicative",
    url: VC_L + "#42-tell-verbs-report-to",
    def: "Non-factive communicative verbs with an obligatory or optional recipient. Information transfer from speaker to addressee. Diagnostic: recipient ditransitive + factive passive on recipient (he was told that…).",
    levin: "Levin §37.1.1 / VerbNet tell-37.2, advise-37.9",
    members: ["advise","alert","assure","caution","confide","convince","demonstrate","forewarn","get_across","get_through","implore","instruct","persuade","pledge","promise","reassure","remind","signal","swear","tell","threaten","tip_off","vow","warn"] },

  "4.3": { label: "Confess", sec: "§4.3", short: "Confess (4.3)",
    fullName: "Confess Verbs (Concessive)",
    ahg: "communicative",
    url: VC_L + "#43-confess-verbs-concessive",
    def: "Factive communicative verbs. The speaker acknowledges the truth of a proposition — a concession, disclosure, or confirmation. Intersection of communicative and factive.",
    levin: "Levin §37.10 / VerbNet confess-37.10",
    members: ["acknowledge","admit","apologize","approve","bear_out","blame","bless","bring_home","chastise","come_clean","conceal","confirm","congratulate","console","consult","contact","depose","detail","disapprove","disclose","document","fess_up","flaunt","forgive","gasp","give_away","grimace","inform","insult","let_on","let_out","let_slip","notify","own","own_up","pity","point_out","prove","reveal","rouse","share","show","stress","weep","whine"] },

  "4.4": { label: "Lie", sec: "§4.4", short: "Lie (4.4)",
    fullName: "Lie Verbs (Counter-Factive)",
    ahg: "communicative",
    url: VC_L + "#44-lie-verbs-counter-factive",
    def: "Counter-factive communicative verbs. The speaker presents a false proposition as true, or retracts a prior assertion. The complement is presupposed false.",
    levin: "No established Levin class; closest VerbNet say-37.7 counter-factive subset",
    members: ["delude","fabricate","fake","feign","fool","lie","manufacture","misinform","mislead","retract","trick"] },

  "5.1": { label: "Want", sec: "§5.1", short: "Want (5.1)",
    fullName: "Want Verbs (Desiderative)",
    ahg: "desiderative",
    url: VC_L + "#51-want-verbs-desiderative",
    def: "Non-factive desiderative/volitional verbs. The subject desires, intends, or prefers a prospective state of affairs. Diagnostic: subject-control infinitive (want to leave).",
    levin: "Levin §32.1 / VerbNet want-32.1",
    members: ["anticipate","consent","decide","desire","hope","intend","plan","prefer","resolve","want","wish"] },

  "6.1": { label: "Order", sec: "§6.1", short: "Order (6.1)",
    fullName: "Order Verbs (Directive)",
    ahg: "directive",
    url: VC_L + "#61-order-verbs-directive",
    def: "Non-factive directive verbs. The matrix subject attempts to bring about an action by the complement subject. Range: polite request to strong command to permission. Diagnostic: mandative subjunctive (ordered that he leave).",
    levin: "Levin §§58–67 / VerbNet order-60.1, ask-58.3, force-59",
    members: ["allow","ask","beg","command","demand","direct","enjoin","exhort","force","mandate","order","permit","prescribe","request","require","urge"] },

  "7.1": { label: "Seem", sec: "§7.1", short: "Seem (7.1)",
    fullName: "Seem Verbs (Raising Evidential)",
    ahg: "evidential",
    url: VC_L + "#71-seem-verbs-raising-evidential",
    def: "Non-factive raising-evidential verbs. The predicate expresses an epistemic stance without assigning a theta-role to the matrix subject. Diagnostic: subject-to-subject raising (he seems to be ill).",
    levin: "Levin §109 / VerbNet seem-109",
    members: ["appear","emerge","follow","mean","seem","transpire","turn_out"] },

  "8.1": { label: "See", sec: "§8.1", short: "See (8.1)",
    fullName: "See Verbs (Perception)",
    ahg: "perception",
    url: VC_L + "#81-see-verbs-perception",
    def: "Semi-factive direct perception verbs. The subject perceives a state of affairs. Responsive (interrogative complement allowed). Diagnostic: bare infinitive / progressive small clause (saw him leave / leaving).",
    levin: "Levin §§30–30.4 / VerbNet see-30.1, hear-30.2",
    members: ["feel","hear","notice","observe","overhear","perceive","see","sense","spot","watch","witness"] },

  "9.1": { label: "Manage", sec: "§9.1", short: "Manage (9.1)",
    fullName: "Manage Verbs (Implicative)",
    ahg: "cognitive",
    url: VC_L + "#91-manage-verbs-implicative",
    def: "Implicative predicates: the complement's truth value is entailed by (or follows from the negation of) the matrix. Positive implicatives (manage, happen) entail complement truth; negative implicatives (fail) entail complement falsity.",
    levin: "Levin §§95–96 / VerbNet succeed-74, try-61",
    members: ["bother","care","fail","happen","manage","try"] },
};

// Build fast verb → levin_class lookup
window.DACE_VERB_TO_LEVIN = {};
Object.entries(window.DACE_LEVIN_CLASSES).forEach(([code, c]) => {
  c.members.forEach((v) => { window.DACE_VERB_TO_LEVIN[v] = code; });
});

// Ordered list of Levin class codes
window.DACE_LEVIN_ORDER = ["1.1","1.2","1.3","1.4","2.1","2.2","3.1","4.1","4.2","4.3","4.4","5.1","6.1","7.1","8.1","9.1"];

// Distinct colors for each Levin class (16 colors)
window.DACE_LEVIN_COLORS = {
  "1.1":"#3b6ea5","1.2":"#2e8a6e","1.3":"#7a59b8","1.4":"#b88630",
  "2.1":"#3f8f70","2.2":"#6b80c0",
  "3.1":"#c05070",
  "4.1":"#1f7a63","4.2":"#2a6f3a","4.3":"#7a6830","4.4":"#a03848",
  "5.1":"#c08030",
  "6.1":"#b03060",
  "7.1":"#408888",
  "8.1":"#5060c0",
  "9.1":"#808040",
};
