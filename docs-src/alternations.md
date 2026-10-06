# DACE — Complement-Embedding Alternations

*Dictionary of Alternations in Clause Embedding*

This document describes the syntactic alternations, semantic properties, and morphosyntactic features used to classify English clause-embedding predicates in `predicates.csv`. Every column in the database has a corresponding section here describing its empirical tests, what the property reveals about predicate class, and the relevant literature. Sections are organised into five Parts:

- **Part A** (§§1–12): Complement-type selection
- **Part B** (§§13–18): Matrix structural alternations
- **Part C** (§§19–20): Complement–matrix interface phenomena
- **Part D** (§§21–24): Semantic and inferential properties
- **Part E** (§§25–27): Morpholexical classification

Within each Part, sections follow the column order in `predicates.csv` so that the database and documentation are directly cross-referenceable. Alternation sections follow the organisation of Levin (1993), with each alternation characterised by the syntactic frames a participating predicate may appear in, illustrated with numbered examples.

---

# Part A — Complement-type selection

*What morphosyntactic form can the complement take? These sections cover C-selection properties — the syntactic category and form of the embedded clause — including finite types (declarative, interrogative, mandative subjunctive, wh-exclamative), non-finite and reduced types (infinitival, for-to, bare infinitive, gerund, poss-ing/acc-ing, small clause), nominal complements, and quotative/direct-speech frames.*

---

## 1. The Declarative (That-Clause) Complement

All predicates in this inventory take a finite declarative complement introduced
by the complementiser *that*. Because this property defines the collection, it
does not constitute an alternation in the usual sense; it is rather the baseline
construction against which the other alternations are defined.

The complementiser may be optionally omitted with the majority of these
predicates:

> (1)  a.  She believed [that he was innocent].  
>      b.  She believed he was innocent.
>
> (2)  a.  He said (that) the proposal had been rejected.  
>      b.  She knew (that) it was hopeless.  
>      c.  He regretted (that) she had left.  
>      d.  It surprised me (that) she had called.

A small number of predicates disfavour or resist deletion, particularly in formal
registers or when the embedded proposition is contrastively focused:

> (3)  a.  The court ruled that the evidence was inadmissible.  
>      b.  ??The court ruled the evidence was inadmissible.

The that-clause complement is presupposed to be true by factive predicates
(*know*, *regret*, *discover*) but is asserted without presupposition by
non-factive predicates (*believe*, *think*, *say*). This distinction in factivity
is orthogonal to the syntactic alternations described in subsequent sections.

**Participating classes:** all classes in this inventory.

---

## 2. The Infinitival Complement Alternation

A substantial subclass of clause-embedding predicates allows alternation between a
finite that-clause and an infinitival (to-VP) complement. The alternation takes
two main forms depending on whether the infinitival complement is controlled by
the matrix subject (subject-control) or requires an overt NP argument (ECM,
raising-to-object, or object-control):

> (4)  a.  She wanted [that she would leave].  *(finite)*  
>      b.  She wanted [to leave].  *(subject-control infinitive)*
>
> (5)  a.  She believed [that he was innocent].  *(finite)*  
>      b.  She believed [him to be innocent].  *(ECM infinitive)*
>
> (6)  a.  She persuaded him [that he should leave].  *(finite)*  
>      b.  She persuaded him [to leave].  *(object-control infinitive)*

The ECM infinitive (5b), in which the matrix object is the surface subject of the
embedded predicate, is characteristic of cognitive and communicative predicates
that take an object NP argument (*believe*, *consider*, *show*, *tell*). The
object-control infinitive (6b) is characteristic of directive and communicative
predicates that transfer a directive to a recipient (*persuade*, *warn*, *order*,
*urge*). Subject-control infinitives (4b) are characteristic of desiderative
predicates (*want*, *wish*, *hope*, *intend*, *decide*).

The infinitival complement does not alternate with the that-clause complement in
psych-causative predicates (*surprise*, *annoy*, *amuse*) or in raising-evidential
predicates (*seem*, *appear*), which take an expletive *it* subject in their
finite construction and a raised NP subject in their infinitival construction
(see §13 below).

**Participating classes:** desiderative (§5.1), directive (§6.1), report-to
(§4.2), assertive report (§4.1, partial), conjecture (§1.3, marginal ECM),
comprehend (§1.1, ECM subset).

---

## 3. The Interrogative Complement Alternation

A subclass of clause-embedding predicates, termed *responsive* predicates, alternates
between a declarative that-clause and an indirect interrogative complement
introduced by a wh-word or by *whether*:

> (7)  a.  She knew [that he was there].  *(declarative)*  
>      b.  She knew [whether he was there].  *(polar interrogative)*  
>      c.  She knew [where he was].  *(constituent interrogative)*
>
> (8)  a.  She discovered [that the keys were missing].  *(declarative)*  
>      b.  She discovered [who had taken the keys].  *(constituent interrogative)*

Predicates that lack the interrogative alternation are termed *anti-responsive*.
These predicates embed only declarative complements:

> (9)  a.  She believed [that he was innocent].  
>      b.  \*She believed [whether he was innocent].  
>      c.  \*She believed [who was innocent].

The responsive/anti-responsive distinction is strongly correlated with factivity
and semantic class. Factive and semi-factive cognitive predicates (*know*,
*discover*, *realise*, *notice*) are typically responsive. Non-factive doxastic
predicates (*believe*, *think*, *suppose*, *reckon*) are uniformly anti-responsive.
Among communicative predicates, responsiveness is restricted to informational
predicates (*show*, *explain*, *tell*, *demonstrate*) as opposed to pure assertion
predicates (*say*, *claim*, *assert*), which are anti-responsive.

The interrogative complement does not occur with psych-causative predicates
(*surprise*, *annoy*), emotive predicates (*regret*, *love*), desiderative
predicates (*want*, *wish*), or directive predicates (*order*, *demand*).

**Participating classes:** comprehend (§1.1, responsive), discover (§1.2,
responsive), perception (§8.1), communicative responsive subsets of report-to
(§4.2) and assertive report (§4.1).

---

## 4. The Gerund Complement Alternation

Several classes of clause-embedding predicates allow alternation between a finite
that-clause and a gerund (V-*ing*) complement:

> (10) a.  She regretted [that she had lied].  *(finite)*  
>      b.  She regretted [lying].  *(gerund)*
>
> (11) a.  He admitted [that he had taken the money].  *(finite)*  
>      b.  He admitted [taking the money].  *(gerund)*
>
> (12) a.  She suggested [that they should leave].  *(finite)*  
>      b.  She suggested [leaving].  *(gerund)*

The gerund complement is semantically similar to the finite complement but tends
to presuppose the eventuality it describes, making it more natural with factive
and semi-factive predicates. The finite complement allows embedded tense and
polarity marking, which the gerund does not freely permit:

> (13) a.  She regretted [that she had **not** lied].  *(negation in finite)*  
>      b.  She regretted [**not** lying].  *(gerund with negation, marked but possible)*  
>      c.  She regretted [not **having** lied].  *(perfect gerund)*

The gerund alternation is characteristic of factive-emotive predicates (*regret*,
*resent*, *hate*, *enjoy*, *love*, *lament*), concessive communicative predicates
(*admit*, *acknowledge*, *confess*), and non-directive communicative predicates
(*suggest*, *recommend*, *propose*). It is absent with doxastic predicates
(*believe*, *think*), psych-causative predicates (*surprise*, *annoy*), directive
predicates (*order*, *demand*), and raising-evidential predicates (*seem*, *appear*).

**Participating classes:** factive emotive (§2.1), concessive (§4.3), assertive
report (§4.1, partial).

---

## 5. The Small Clause Complement

A restricted set of predicates allows a small clause — a predicative phrase
without an overt finite verb — as their complement:

> (14) a.  She considered [him a fool].  *(NP small clause)*  
>      b.  She found [the proposal unacceptable].  *(AP small clause)*  
>      c.  She wanted [him out of the house].  *(PP small clause)*

The small clause complement is most productive with cognitive predicates of
evaluation (*consider*, *find*, *deem*, *judge*), where it alternates with a
finite that-clause containing a copula:

> (15) a.  She considered [that he was a fool].  
>      b.  She considered [him a fool].

The small clause complement is also found with perception predicates in their
eventive reading (*see*, *hear*, *watch*, *feel*):

> (16) a.  She saw [him cross the road] / [him crossing the road].  
>      b.  She heard [the door slam].

The small clause complement is absent from communicative predicates (other than
the show/demonstrate subtype), psych-causative predicates, emotive predicates,
desiderative predicates, and raising-evidential predicates.

**Participating classes:** conjecture subset (§1.3: *consider*, *deem*, *judge*),
perception (§8.1), report-to subset (§4.2: *show*, *demonstrate*).

---

## 6. The NP Complement Alternation

Several classes of clause-embedding predicates allow alternation between a finite
that-clause and a propositional NP complement:

> (17) a.  She claimed [that he had lied].  *(finite)*  
>      b.  She denied [the accusation].  *(propositional NP)*
>
> (18) a.  He admitted [that he had been there].  *(finite)*  
>      b.  He admitted [the error].  *(nominal)*
>
> (19) a.  She promised [that she would return].  *(finite)*  
>      b.  She promised [her return].  *(nominal)*

The propositional NP alternant is not fully synonymous with the finite clause:
the NP nominalization tends to be less specific and does not carry embedded tense
or polarity marking. Both constructions, however, encode a propositional attitude
of the matrix subject toward an embedded content. The alternation is available with
communicative predicates (*claim*, *deny*, *report*, *announce*, *admit*,
*promise*) and cognitive predicates (*know*, *believe*, *doubt*, *suspect*,
*expect*, *remember*).

It is absent from psych-causative predicates and raising-evidential predicates,
which require a full clausal complement.

**Participating classes:** assertive report (§4.1, partial), tell verbs (§4.2,
partial), concessive (§4.3, partial), comprehend (§1.1, partial), conjecture
(§1.3, partial).

---

## 7. The Quotative (Direct Speech) Alternation

A large subclass of communicative predicates allows alternation between the
indirect speech construction with a finite that-clause and a quotative
construction with a directly quoted string:

> (33) a.  She said [that he was late].  *(indirect speech)*  
>      b.  She said ['He is late.'].  *(direct speech / quotative)*
>
> (34) a.  He whispered [that she should leave].  *(indirect)*  
>      b.  He whispered ['You should leave.'].  *(direct)*
>
> (35) a.  She admitted [that she had been wrong].  *(indirect)*  
>      b.  She admitted ['I was wrong.'].  *(direct)*

The quotative construction is restricted to predicates that can denote an act
of speaking or vocalization. It is therefore absent from cognitive predicates
(*believe*, *think*, *know*), emotive predicates (*regret*, *fear*, *love*),
psych-causative predicates (*surprise*, *amuse*), desiderative predicates
(*want*, *wish*), and raising-evidential predicates (*seem*, *appear*).

Among communicative predicates, manner-of-speaking verbs (*whisper*, *mutter*,
*shout*, *growl*, *bark*) take the quotative alternation freely, as do assertion
verbs (*claim*, *assert*, *declare*, *state*) and response verbs (*reply*,
*retort*, *answer*). Stative cognitive predicates such as *understand* or
*realise* do not take the quotative alternation.

**Participating classes:** assertive report (§4.1), tell verbs (§4.2), concessive
(§4.3, partial).

---

## 8. The Mandative Subjunctive Complement

A subclass of communicative and directive predicates selects a complement clause
containing a bare infinitival verbal form in the mandative subjunctive:

> (36) a.  She insisted [that he leave].  *(mandative subjunctive)*  
>      b.  She insisted [that he was leaving].  *(indicative — different reading)*
>
> (37) a.  They demanded [that the report be released immediately].  *(mandative)*  
>      b.  They demanded [that the report was released immediately].  *(indicative — factual)*

The mandative subjunctive complement encodes a directive content: the subject
of the embedded clause is directed to bring about the embedded eventuality. This
contrasts with the indicative, which encodes a factual or epistemic claim. The
mandative subjunctive is therefore a diagnostic for directive and
directive-communicative predicates:

> (38) a.  She ordered [that he leave at once].  *(mandative: directive)*  
>      b.  She reported [that he left at once].  *(indicative only: factual)*

The mandative subjunctive may be replaced by *should* in informal registers:

> (39)  She insisted that he leave / that he should leave.

Purely factual reporting predicates (*say*, *claim*, *believe*, *know*) do not
take the mandative subjunctive, nor do emotive or psych-causative predicates.

**Participating classes:** directive (§6.1), partial in assertive report
(§4.1) and report-to (§4.2) (*insist*, *stipulate*, *decree*, *mandate*,
*recommend*, *propose*).

---

## 9. The For-To Infinitival Complement

A subset of clause-embedding predicates permits an infinitival complement in
which an overt NP subject appears inside the complement and is introduced by
the complementiser *for*:

> (67)  a.  She arranged **for him to attend**.  
>       b.  She hoped **for the proposal to be accepted**.  
>       c.  She waited **for the package to arrive**.  
>       d.  She would prefer **for him to handle it**.

This construction is structurally distinct from ECM (§2), in which no *for*
complementiser is present and the embedded subject bears matrix case (*She
believed **him** to be innocent*), and from object-control infinitives, in which
the overt NP is the theta-role-bearing object of the matrix predicate (*She
persuaded **him** to leave*). In the for-to construction, the embedded subject
receives no theta-role from the matrix predicate:

> (68)  a.  She believed [him to be innocent].  *(ECM: no for; him bears matrix case)*  
>       b.  She persuaded [him to leave].  *(object-control: him is matrix object)*  
>       c.  She arranged [for him to attend].  *(for-to: him inside for-CP)*  
>       d.  She hoped [for it to rain].  *(for-to: expletive it possible — rules out control)*

The for-to construction is licensed by desiderative predicates (*hope*, *wish*,
*long*, *prefer*), arrangement predicates (*arrange*, *plan*), and some causatives.
It is excluded with purely doxastic predicates:

> (69)  a.  \*She believed for him to be innocent.  
>       b.  \*She knew for the result to be final.

**Tests.** (a) Insert *for* before the embedded subject; (b) replace the
embedded subject with the expletive *it* or *there* to verify the embedded
subject is not a matrix theta-role-bearer.

**What it shows.** For-to licensing indicates that the predicate selects a
complement expressing a non-actual (desiderative, prospective, or
arrangement) event, where the embedded subject has no theta-role assignment
from the matrix predicate and no matrix case transfer.

**Literature.** Koster & May (1982) discuss the structural properties of the
for-complementiser. Pesetsky (1991) distinguishes for-to from ECM in terms
of case. Wurmbrand & Lohninger (2023, *An Implicational Universal in
Complementation*) situate the for-to type within a typology of complement
clause sizes.

---

## 10. The Bare Infinitive vs. Participial (Progressive) Complement

Perception predicates allow alternation between a bare infinitive complement
and a progressive (participial) complement, with a systematic aspectual
difference:

> (70)  a.  She saw [him **cross** the road].  *(bare infinitive: complete event)*  
>       b.  She saw [him **crossing** the road].  *(progressive: event in progress)*
>
> (71)  a.  She heard [the door **slam**].  *(complete, punctual event)*  
>       b.  She heard [someone **slamming** the door].  *(ongoing action)*
>
> (72)  a.  She felt [the ground **shake**].  *(complete tremor)*  
>       b.  She felt [the ground **shaking**].  *(ongoing shaking)*

The bare infinitive form reports that the perceiver witnessed the event in its
entirety from initiation to completion. The progressive form reports that the
perceiver observed the event in progress, without necessarily witnessing its
completion or onset. For durative events the distinction is semantically
robust; for punctual events it may collapse.

The alternation is restricted to direct perception predicates (*see*, *hear*,
*watch*, *feel*, *notice*). It is unavailable with cognitive evaluative
predicates that take small clauses:

> (73)  a.  She considered [him a fool].  *(NP small clause)*  
>       b.  \*She considered [him being a fool].  *(ungrammatical in this sense)*

**Tests.** (a) Can the predicate take both a bare infinitive and a progressive
complement with a durative verb? (b) Is there an aspectual contrast (complete
vs. ongoing)? (c) Does the progressive form allow cancellation of event
completion (*I saw him leaving but he turned back* ✓ vs *\*I saw him leave but
he turned back*)?

**What it shows.** The alternation is diagnostic for the direct perception class,
separating it from cognitive evaluative predicates (NP/AP small clauses) and
from purely indirect perception predicates (finite complements only).

**Literature.** Higginbotham (1983, *Linguistic Inquiry* 14) provides an early
formal analysis. Delfitto (2006) situates the contrast within an aspect-projection
framework. Huddleston & Pullum (2002, *Cambridge Grammar of the English Language*,
Ch. 14) provide a thorough descriptive account of perception verb complementation.

---

## 11. The Embedded Wh-Exclamative Complement

A subclass of clause-embedding predicates admits a wh-exclamative complement —
a complement introduced by a wh-word and expressing an extreme or notable
degree — while the majority of predicates reject such complements.

> (74)  a.  I know [what a linguist she is]! ✓  
>       b.  I realize [how talented he is]! ✓  
>       c.  I noticed [what a mess the room was in]. ✓  
>       d.  \*I believe [what a linguist she is].  
>       e.  \*I think [how talented he is].  
>       f.  \*She said [what a mess the room was in].  
>       g.  \*It surprised me [what a brilliant result she achieved].

The wh-exclamative complement is distinct from the wh-interrogative complement
(§3). Interrogative complements include polar (*whether*) and constituent
(*who*, *what*) questions and are admitted by both factive and some non-factive
predicates. Exclamative complements involve a degree-evaluative reading (*what
a great X*; *how Adj*) and are restricted to factive predicates:

> (75)  a.  She knows [what he bought].  *(wh-interrogative: responsive)*  
>       b.  She knows [what a brilliant thing he bought]! *(wh-exclamative: factive)*  
>       c.  She wonders [what he bought].  *(wh-interrogative: wonder is non-factive)*  
>       d.  \*She wonders [what a brilliant thing he bought].  *(exclamative: unavailable)*

**Tests.** (a) Insert a degree exclamative (*what a N*, *how Adj*) as the
complement; (b) verify the sentence has an expressive, degree-marking reading;
(c) verify the predicate must be factive for grammaticality.

**What it shows.** Wh-exclamative embedding is a strict diagnostic for factivity
that goes beyond the standard presupposition tests: it requires both
presupposition of the complement content and the availability of an evaluative,
non-at-issue expressive reading. It therefore provides an additional test
separating factive predicates from semi-factive and non-factive predicates,
and is particularly useful for borderline cases.

**Participating classes.** Comprehend verbs (*know*, *understand*, *appreciate*),
discover verbs (*realize*, *notice*), factive emotive predicates (*regret*,
partially). Not available with non-factive cognitive, communicative,
psych-causative, or raising predicates.

**Literature.** Zanuttini & Portner (2003, *Language* 79:1) is the foundational
formal analysis of exclamative clauses; they argue that exclamatives contain an
abstract factive morpheme, explaining the restriction to factive predicates.
Lahiri (2002, *Questions and Answers in Embedded Contexts*, Kluwer) discusses
embedding restrictions on exclamative complements. d'Avis (2002, *On the
Interpretation of Wh-Clauses in Exclamative Environments*) provides
cross-linguistic comparison.

---

## 12. The Possessive vs. Accusative Gerund (Poss-ing / Acc-ing)

Section §4 treats the gerund complement as a single type. A further alternation
exists within gerund complements between the possessive gerund (*poss-ing*,
in which the gerund subject bears genitive/possessive case) and the accusative
gerund (*acc-ing*, in which the gerund subject bears accusative case):

> (76)  a.  She resented [**his** leaving]. *(poss-ing: genitive subject)*  
>       b.  She resented [**him** leaving]. *(acc-ing: accusative subject)*
>
> (77)  a.  She remembered [**his** calling late at night].  
>       b.  She remembered [**him** calling late at night].
>
> (78)  a.  She disapproved of [**his** taking so long].  
>       b.  She disapproved of [**him** taking so long].

The poss-ing construction treats the gerund phrase as more nominal: the *-ing*
form heads a noun phrase modified by a possessive, and the predicate expresses
an attitude toward the fact or state of affairs described. The acc-ing
construction treats the gerund phrase as more clausal: the *-ing* form heads
a participial clause with an accusative subject, and the predicate expresses
an attitude toward the event itself.

The two constructions are not interchangeable for all predicates. Predicates
of evaluation and disapproval favour poss-ing; predicates of perception and
memory allow both but with aspectual differences (see §10). With non-human
or non-referential subjects, acc-ing is typically required:

> (79)  a.  She resented [**the train** arriving late]. *(acc-ing: natural)*  
>       b.  ??She resented [**the train's** arriving late]. *(poss-ing with inanimate: marked)*

**Tests.** (a) Does the predicate accept both genitive and accusative case on
the gerund subject? (b) Is there a meaning difference between the two forms?
(c) Does replacement by an expletive subject reveal which form is genuinely
clausal?

**What it shows.** The alternation tracks the degree to which the predicate
nominalises its complement. Predicates that fully nominalise the complement
(treating it as an abstract propositional object) favour poss-ing; predicates
that retain the clausal structure (treating it as an event or process) favour
acc-ing. The distribution correlates with the verb's position on the
nominal–verbal spectrum of its complement selection.

**Literature.** Pullum & Huddleston (2002, *Cambridge Grammar of the English
Language*, Ch. 13) provide a detailed descriptive account. Reuland (1983,
*Governing -ing*, *Linguistic Inquiry* 14:1) analyses the structural differences
in terms of phrase-level category membership. Abney (1987, *The English Noun
Phrase in its Sentential Aspect*, MIT dissertation) situates the contrast within
DP-structure theory.

---

# Part B — Matrix structural alternations

*Levin-style structural rearrangements at the matrix clause level that clause-embedding predicates participate in. These change the surface form without altering the basic predicate-complement relationship. Weak island effects are semantically conditioned but represent overt syntactic behaviour and are grouped here.*

---

## 13. The Extraposition Alternation

Many clause-embedding predicates allow alternation between a construction in
which the embedded clause appears in canonical subject or object position and a
construction in which the clause is rightward-extraposed and replaced by a
dummy *it*:

> (20) a.  [That she left] surprised him.  *(canonical subject)*  
>      b.  It surprised him [that she left].  *(extraposed subject)*
>
> (21) a.  He found [that she had been lying] troubling.  
>      b.  He found it troubling [that she had been lying].  *(with *it* placeholder)*

For psych-causative predicates (*surprise*, *annoy*, *amuse*, *shock*), the
extraposed construction is the neutral active-voice frame; the pre-verbal clausal
subject is syntactically possible but stylistically marked:

> (22) a.  It annoyed her [that he was late].  *(neutral)*  
>      b.  ?[That he was late] annoyed her.  *(marked)*

For raising-evidential predicates (*seem*, *appear*, *turn_out*), the expletive
*it* subject is obligatory in the finite construction; these predicates do not
allow a referential clausal subject:

> (23) a.  It seems [that she has resigned].  *(grammatical)*  
>      b.  \*She seems [that she has resigned].  *(ungrammatical)*

For most non-psych, non-raising predicates, extraposition is optional and
stylistically determined:

> (24) a.  She regretted [that she had left].  *(fine)*  
>      b.  ??It regretted her [that she had left].  *(generally ungrammatical with experiencer subject)*

Obligatory or strongly preferred extraposition thus serves as a diagnostic for
psych-causative and raising-evidential predicates; the alternation is available
more broadly but is not required.

**Participating classes:** psych causative (§3.1, obligatory in active),
raising evidential (§7.1, obligatory); marginally available elsewhere.

---

## 14. The Raising Alternation

The raising-evidential predicates allow alternation between an impersonal
*it*-subject construction with a finite complement and a raising construction
in which the subject of the embedded complement is raised to matrix subject
position:

> (25) a.  It seems [that he is ill].  *(expletive subject)*  
>      b.  He seems [to be ill].  *(raised subject)*
>
> (26) a.  It turned out [that she was wrong].  *(expletive subject)*  
>      b.  She turned out [to be wrong].  *(raised subject)*

In the raising construction, the surface matrix subject bears no theta role with
respect to the matrix predicate; the theta role is discharged by the embedded
predicate. This is evidenced by the availability of expletive and idiom-chunk
subjects, which lack independent reference:

> (27) a.  It seems that there is a problem.  →  There seems to be a problem.  
>      b.  It seems that the cat is out of the bag.  →  The cat seems to be out of the bag.

The raising alternation is not available to any other class in this inventory.
Cognitive and emotive predicates do not raise:

> (28) a.  She knew that he was ill.  
>      b.  \*He knew to be ill.  *(ungrammatical as raising)*
>
> (29) a.  She regretted that he was late.  
>      b.  \*He regretted to be late.  *(ungrammatical as raising)*

**Participating classes:** raising evidential (§7.1) exclusively; *be_certain*
and *be_sure* (§1.1) participate marginally (*She is certain to win*).

---

## 15. The Recipient (Ditransitive) Alternation

Many communicative predicates allow an optional or obligatory recipient NP
argument between the verb and the embedded complement:

> (30) a.  The sign warned [that the bridge was unsafe].  *(no recipient)*  
>      b.  The sign warned drivers [that the bridge was unsafe].  *(with recipient)*
>
> (31) a.  She told [that the project was cancelled].  *(marginal without recipient)*  
>      b.  She told him [that the project was cancelled].  *(with recipient)*

For some predicates the recipient argument is obligatory:

> (32) a.  \*She informed that the meeting was postponed.  *(recipient required)*  
>      b.  She informed us that the meeting was postponed.

The recipient argument is typically animate and denotes the addressee of the
communicated information. The ditransitive frame creates an oriented
communication: the matrix subject communicates the propositional content to the
recipient.

The recipient alternation is absent from purely predicational constructions
(*seem*, *appear*), emotive predicates (*regret*, *fear*), psych-causative
predicates (*surprise*, *amuse*) in their basic active transitive frame, and
doxastic predicates (*believe*, *think*).

**Participating classes:** report-to (§4.2, defining alternation), partial
in assertive report (§4.1), concessive (§4.3), and directive (§6.1).

---

## 16. The Factive Passive

Several classes of clause-embedding predicates allow a passive construction in
which the clausal complement is retained after the passivized verb:

> (40) a.  It surprised me [that she had left].  *(active, psych-causative)*  
>      b.  I was surprised [that she had left].  *(factive passive)*
>
> (41) a.  She told him [that the meeting was cancelled].  *(active, ditransitive)*  
>      b.  He was told [that the meeting was cancelled].  *(passive, recipient promoted)*
>
> (42) a.  She informed us [that the bridge was unsafe].  *(active)*  
>      b.  We were informed [that the bridge was unsafe].  *(passive)*

For psych-causative predicates (40), the passive promotes the experiencer object
to subject. For ditransitive communicative predicates (41–42), the passive
promotes the recipient object to subject. In both cases the complement clause is
retained in postverbal position.

The factive passive is not available to cognitive predicates (*know*, *believe*,
*comprehend*), whose subjects are inherently stative experiencers and which do
not form regular passives:

> (43) a.  She knew that he was guilty.  
>      b.  \*He was known that he was guilty.  *(ungrammatical as experiencer passive)*

Nor is it available to emotive predicates with a subject experiencer (*regret*,
*fear*, *love*):

> (44) a.  She regretted that she had lied.  
>      b.  \*She was regretted that she had lied.

**Participating classes:** psych causative (§3.1), report-to (§4.2, partial:
verbs with overt recipient *tell*, *inform*, *warn*, *advise*, *remind*, *assure*).

---

## 17. Negative Raising

Negative raising (NR) is the phenomenon by which negation placed in the matrix
clause of a clause-embedding predicate is interpreted as taking scope within the
embedded clause. A predicate licences NR if the surface parse *S neg V that p*
has a prominent reading equivalent to *S V that neg p*.

> (50)  a.  I don't think he'll come.  *(surface: neg in matrix)*  
>       b.  ≈ I think he won't come.  *(reading: neg in embedded)*
>
> (51)  a.  She doesn't believe it's raining.  
>       b.  ≈ She believes it isn't raining.
>
> (52)  a.  He doesn't want her to leave.  
>       b.  ≈ He wants her not to leave.

The NR reading is unavailable with factive predicates, emotive predicates, and
predicates whose complements are presupposed:

> (53)  a.  She doesn't know that he's here.  (≠ She knows that he isn't here)  
>       b.  She doesn't regret that she left.  (≠ She regrets that she didn't leave)  
>       c.  It doesn't surprise me that she called.  (≠ It surprises me that she didn't call)

**Tests.**

*(a) The either...or diagnostic* (Horn 1978): *I don't think p or q* is ambiguous
for NR predicates — it can mean *I think neither p nor q* — but unambiguous for
non-NR predicates.

*(b) Contradiction test:* *I don't think p, in fact I think p* is contradictory
for NR predicates (the NR reading and the assertion conflict) but not for non-NR
predicates.

**What it shows.** NR correlates with non-factivity and with the *excluded middle*
inference pattern of doxastic predicates: negating the matrix attitude shifts
the polarity of the embedded proposition rather than denying the attitude
altogether. Horn (1978) argues that NR predicates are those whose complements
have exactly two polar alternatives (*p* or *not-p*), so negating the attitude
yields the attitude toward the opposite alternative.

**Participating classes.** Doxastic/conjecture predicates (*think*, *believe*,
*suppose*, *assume*, *expect*, *reckon*, *want*, *hope*); not available with
factives (*know*, *realize*, *regret*), psych-causatives (*surprise*, *annoy*),
or communicative predicates.

**Literature.** Horn (1978, *A Logical Theory of Quantification in Natural
Language*) is the foundational treatment. Collins & Postal (2014, *Classical
NEG Raising*, MIT Press) argue for a syntactic movement analysis. Gajewski
(2007) gives a scalar semantics account; Homer (2015, *Neg-Raising and Positive
Polarity: The View from Modals*) connects NR to scalarity; White & Rawlins
(2016) treat it as a graded property in the MegaAttitude dataset.

---

## 18. Weak Island Sensitivity and Bridge Effects

Clause-embedding predicates divide into bridge verbs, which permit long-distance
wh-extraction from their complement clause, and non-bridge (weak island)
predicates, which resist such extraction. The `weak_island` column codes this:
1 = the predicate resists extraction (is a weak island); 0 = extraction is
permitted (acts as a bridge verb).

> (63)  a.  What did she say [that he bought ___]? ✓  *(say: bridge verb)*  
>       b.  What did she think [that he bought ___]? ✓  *(think: bridge verb)*  
>       c.  ?What did she know [that he bought ___]?  *(know: degraded, weak island)*  
>       d.  \*What did she regret [that he bought ___]?  *(regret: strong island)*

**Tests.**

*(a) Wh-extraction test.* Form a wh-question in which the wh-item originates
inside the embedded clause. Degradation indicates weak island status.

*(b) Topicalisation test.* Topicalise an element from the embedded clause:
*Beans, she said / \*regretted that he likes.*

*(c) Relative clause test.* Form a relative clause: *the beans that she said /
\*regretted he liked.*

**What it shows.** Bridge effects are a reliable diagnostic for the at-issue
status of the complement. The complement of a bridge verb is asserted: its
internal constituents are accessible to focus-sensitive operations. The
complement of a weak-island predicate is backgrounded, presupposed, or
irrealis, and its internal constituents are not accessible. Factivity is a
strong predictor of weak island status — a presupposed complement is a
frozen domain for extraction — but the two properties dissociate: some
non-factive predicates are also islands (*wonder*, *doubt*).

**Literature.** Erteschik-Shir (1973, *On the Nature of Island Constraints*,
MIT dissertation) is the foundational observation. Ross (1984) provides
systematic description. Karttunen (1977) connects bridge behaviour to
informational properties. Huang, Sprouse & Hornstein (2022, *Language* 98:3)
provide a large-scale experimental investigation establishing gradient rather
than categorical judgements and a multivariate set of predictors including
verb-frame frequency, information structure, and factivity.

---

# Part C — Complement-matrix interface phenomena

*Operations at the boundary between the embedded clause and the matrix involving substitution or polarity licensing that crosses the clause boundary, where the trigger originates in the matrix (negation scope, polarity operators).*

---

## 19. The Pro-Complement (So/Not) Alternation

A restricted subclass of clause-embedding predicates allows the proform *so*
or the negated proform *not* to substitute for the finite complement clause:

> (45) a.  She believed [that he would return].  →  She believed so.  
>      b.  She did not believe [that he would return].  →  She believed not. / She didn't think so.
>
> (46) a.  He supposed [that the train was late].  →  He supposed so.  
>      b.  I reckon [that she'll come].  →  I reckon so.

The proform *so* picks up a propositional antecedent from the preceding discourse.
The alternation is restricted to non-factive doxastic predicates (*believe*,
*think*, *suppose*, *assume*, *reckon*, *guess*, *suspect*, *expect*), which
express a degree of epistemic commitment without presupposing the truth of the
complement:

> (47) a.  I think so / I believe so / I suppose so / I expect so / I guess so / I reckon so.  
>      b.  \*I know so / \*I realise so.  *(factive: complement presupposed)*  
>      c.  ??I regret so / \*I hope so.  *(emotive: no pure propositional pro-form reference)*  
>      d.  \*It surprised me so.  *(psych causative: no pro-complement)*

The restriction follows from the doxastic predicates' status as pure propositional
attitude verbs: the embedded proposition has the status of an epistemic object that
can be replaced by an anaphoric proform, whereas factive predicates presuppose the
complement and emotive predicates integrate the content into an affective attitude
that resists simple proform substitution.

**Participating classes:** conjecture / doxastic (§1.3) exclusively; marginal with
desiderative *hope*, *expect* (*I hope so*) in informal speech.

---

## 20. NPI Licensing

Certain clause-embedding predicates license negative polarity items (NPIs) in
their complement clauses, while others do not. Classic English NPIs include
*any*, *ever*, *at all*, *yet*, *lift a finger*, and *budge an inch*.

> (61)  a.  She doubts [that anyone left]. ✓  *(doubt: NPI licenser)*  
>       b.  She denied [that anyone was there]. ✓  *(deny: NPI licenser)*  
>       c.  \*She believes [that anyone left].  *(believe: not a licenser)*  
>       d.  \*She said [that anyone had left].  *(say: not a licenser)*  
>       e.  \*She knows [that anyone left].  *(know: not a licenser)*

Licensing follows from the downward-entailing (DE) semantics of the complement
position: a predicate creates a DE environment for its complement if replacing
the complement proposition with a stronger one preserves the truth of the matrix
clause.

**Tests.** Insert a strong NPI (*lift a finger*, *budge an inch*, *ever*) in the
complement clause:

> (62)  a.  She doubts that he has **ever** been there. ✓  
>       b.  \*She thinks that he has **ever** been there.  
>       c.  She denies having done **anything** wrong. ✓  
>       d.  \*She claims to have done **anything** wrong.

**What it shows.** NPI licensing in the complement indicates that the predicate
creates a downward-entailing or non-veridical environment for the embedded
proposition. This correlates with anti-veridical and denial/doubt predicates.
Factive predicates (which presuppose their complements) and positive assertion
predicates (which assert them) do not produce DE environments for the
complement.

**Participating classes.** Denial/doubt predicates (*doubt*, *deny*,
*dispute*); certain predicates of disbelief; marginal in some desideratives.
Not available with factive (*know*, *realize*), doxastic (*think*, *believe*),
or positive communicative predicates (*say*, *claim*).

**Literature.** Giannakidou (1998, *Polarity Sensitivity as (Non)veridicality*,
Benjamins) is the foundational treatment. Zwarts (1995) provides the formal
characterisation. Homer (2015) connects NPI licensing to neg-raising predicates.
Xiang, Grove & Giannakidou (2021, *Journal of Semantics* 38:1) provide
experimental evidence.

---

# Part D — Semantic and inferential properties

*Meaning-level properties that classify predicates by the inferences they license with respect to the truth and type of their complements. These are diagnostics rather than syntactic alternations in the Levin sense.*

---

## 21. The Stative/Achievement Distinction

This is a lexical-aspectual property rather than a syntactic alternation, but it
divides clause-embedding predicates into two groups with systematic syntactic and
semantic consequences.

*Stative* clause-embedding predicates denote a state holding over an interval.
They are incompatible with the progressive and with telic frame adverbials of the
form *in X time*:

> (48) a.  \*She is knowing that he is guilty.  *(progressive ungrammatical)*  
>      b.  \*She is believing that he is guilty.  *(progressive ungrammatical)*  
>      c.  \*She came to know in ten minutes.  *(telic frame anomalous)*

*Achievement* clause-embedding predicates denote a change of state with a telic
endpoint. They are compatible with the progressive (on the verge of / coming to
read), with *in X time* frame adverbials, and with the punctual adverb *suddenly*:

> (49) a.  She is realising that the plan won't work.  *(progressive: imminence reading)*  
>      b.  She realised in an instant that she had been deceived.  *(telic frame)*  
>      c.  She suddenly realised that he was lying.  *(punctual achievement)*

The stative/achievement distinction corresponds primarily to the contrast between
the comprehend class (§1.1, stative factive awareness) and the discover class
(§1.2, achievement semi-factive). Doxastic predicates (*believe*, *think*) are
stative despite their non-factivity. Psych-causative predicates (*surprise*,
*amuse*) are stative in their experiencer-passive reading (*I was surprised that…*)
but may be eventive in active usage (*Her announcement surprised him* —
achievement).

**Stative classes:** comprehend (§1.1), conjecture/doxastic (§1.3), factive
emotive (§2.1), non-factive emotive (§2.2), psych causative (§3.1), assertive
report (§4.1), concessive (§4.3), report-to (§4.2), desiderative (§5.1),
raising evidential (§7.1).  
**Achievement classes:** discover (§1.2), perception (§8.1, partial),
implicative (§9.1).

---

## 22. Factivity

A predicate is factive if it presupposes the truth of its complement clause.
Factivity is not a syntactic alternation but a semantic property that conditions
a large number of the alternations documented here — including §3
(responsive/anti-responsive), §16 (factive passive), §18 (bridge effects), and
§11 (exclamative embedding) — and it is the primary classification axis in the
database.

**Tests.**

*(a) Persistence under negation and questioning.* The complement of a factive
predicate projects its truth even when the matrix is negated or questioned:

> (54)  a.  She knows that he left. → He left.  
>       b.  She doesn't know that he left. → He left.  *(presupposition survives)*  
>       c.  Does she know that he left? → He left.  *(presupposed)*

For non-factive predicates the inference fails under negation:

> (55)  a.  She believes that he left. → possibly he left.  
>       b.  She doesn't believe that he left. → (no inference about whether he left)

*(b) The "the fact that" substitution.* Factive predicates accept the
paraphrase with *the fact that*:

> (56)  a.  She regrets **the fact that** she lied. ✓  
>       b.  She knows **the fact that** he is here. ✓  
>       c.  ??She believes **the fact that** he is here.  
>       d.  ??She said **the fact that** the train was late.

*(c) Conditional preservation.* The embedded clause of a factive retains its
presuppositional truth even inside *if*:

> (57)  a.  If she discovers that he lied, she will be upset. → He lied (presupposed).  
>       b.  If she believes that he lied, she will be upset. → He may or may not have lied.

**Values.** The database codes factivity as: *factive*, *semi-factive*,
*non-factive*. Semi-factive predicates (*discover*, *realize*, *notice*)
presuppose the truth of the complement only in the present-tense stative
reading; in the achievement reading the presupposition is at-issue.

**Literature.** Kiparsky & Kiparsky (1970, in *Progress in Linguistics*, Mouton)
is the foundational paper and motivates the *the-fact-that* test. Karttunen
(1971, *Linguistic Inquiry*) refines the classification. Simons, Tonhauser,
Beaver & Roberts (2010, SALT 20) develop *at-issueness* to explain projection
variability. Tonhauser et al. (2018, *Language* 94:2) provide a large-scale
empirical investigation.

---

## 23. Veridicality

A predicate is veridical if the truth of the matrix clause entails the truth of
the embedded complement. Veridicality is stronger than factivity: factivity is a
presuppositional property, veridicality an entailment property.

> (58)  a.  She knows that p. → p.  *(factive and veridical)*  
>       b.  She doesn't know that p. → p.  *(presupposition persists under negation)*

> (59)  a.  She managed to leave. → She left.  *(veridical under positive: implicative)*  
>       b.  She didn't manage to leave. → She didn't leave.  *(veridical under negative too)*

Anti-veridical predicates are associated with the falsity of the complement:

> (60)  a.  She doubts that he will come.  *(positive commits to unlikelihood / falsity)*  
>       b.  She denied that he had been there.  *(active non-acceptance of the complement)*

Non-veridical predicates (*believe*, *think*, *suppose*) are compatible with
both the truth and falsity of the complement.

**Tests.**

*(a) Entailment under positive.* Does *S V that p* entail *p*?

*(b) Entailment under negative.* Does *S doesn't V that p* entail *p* (factive)
or entail *not-p* (anti-veridical)?

*(c) Contradiction test.* For veridical predicates, *S V that p, but p is false*
is contradictory.

**Values.** The database codes veridicality as: *veridical*, *non-veridical*,
*anti-veridical*.

**Literature.** Zwarts (1995, *Nonveridical Contexts*, in *Linguistic Analysis*
25) introduces the formal distinction. Giannakidou (1998, *Polarity Sensitivity
as (Non)veridicality*, Benjamins; 1999, *Linguistics & Philosophy* 22:2)
develops the comprehensive account. Egré (2008, *Journal of Semantics* 25:1)
applies the distinction to question-embedding predicates. White & Rawlins (2016)
use both factivity and veridicality as primary axes of the MegaAttitude
classification.

---

## 24. Content Noun Compatibility

A predicate is content-noun-compatible if it is grammatical in a construction of
the form *S V the NP that p*, where NP is a content noun such as *fact*, *claim*,
*idea*, *report*, or *news*. This tests the predicate's ability to take a
propositional NP argument headed by a content noun rather than a bare clausal
complement.

> (64)  a.  She knows **the fact** that he left. ✓  
>       b.  She regrets **the fact** that she lied. ✓  
>       c.  ??She believes **the fact** that he left.  
>       d.  ??She thinks **the claim** that the earth is flat.  
>       e.  She heard **the news** that the proposal had been accepted. ✓  
>       f.  She denied **the claim** that he had been there. ✓

**Tests.** Insert a content noun between the verb and the complement clause:
*She Vs the [fact / claim / report / news] that p*. Grammaticality indicates
content-noun compatibility.

**What it shows.** Content noun compatibility tracks two related properties.
First, it is sensitive to factivity: *fact*-NPs require a presupposed true
proposition, so *know / regret / discover the fact that p* are grammatical but
*?believe / think the fact that p* are not (Kiparsky & Kiparsky 1970). Second,
it indicates that the predicate can construe its embedded content as a nominal
propositional object as well as a bare clause — relevant for the NP complement
alternation (§6).

**Literature.** Kiparsky & Kiparsky (1970) use the *the-fact-that* test as a
primary diagnostic for factivity. Vendler (1972, *Res Cogitans*, Cornell UP)
investigates the range of content nouns and their semantic constraints. Asher
(1993, *Reference to Abstract Objects in Discourse*, Kluwer) provides a formal
treatment of fact-NPs.

---

# Part E — Morpholexical classification

*Properties of the predicate's own lexical and morphological form, independent of its complement-taking behaviour.*

---

## 25. Derived Nominals

A clause-embedding predicate may have a corresponding derived nominal — a
deverbal noun formed by affixation (*-tion*, *-ment*, *-al*, *-ure*, *-ance*,
*-ing*) — that preserves the argument structure of the verb and can take a
clausal or nominal complement of the same kind.

> (65)  a.  She believes that p. → her **belief** that p.  
>       b.  She knows that p. → her **knowledge** that p.  
>       c.  She claims that p. → her **claim** that p.  
>       d.  She regrets that p. → her **regret** that p.  
>       e.  She expects that p. → her **expectation** that p.

Not all clause-embedding predicates have productive derived nominals with
clausal complements:

> (66)  a.  It turned out that p. → \*her **turn-out** that p.  
>       b.  It seemed that p. → ??her **seeming** that p.  *(no propositional reading)*  
>       c.  It surprised her that p. → her **surprise** that p. ✓  *(stative nominal only)*

**Tests.** (a) Does the predicate have a morphologically derived nominal?
(b) Does that nominal accept a *that*-clause complement? (c) Does the nominal
preserve the argument structure of the verb (including experiencer, agent, or
recipient)?

**What it shows.** Derived nominals indicate that the predicate encodes a
propositional attitude that can be reified as a nominal concept. Raising
predicates and expletive-subject predicates typically lack them, reflecting
their non-propositional, structural character. The presence of a derived
nominal correlates with the predicate expressing a genuine attitude toward a
propositional content.

**Literature.** Grimshaw (1990, *Argument Structure*, MIT Press) distinguishes
argument-structure nominals from result and event nominals, showing that only
argument-structure nominals inherit the argument structure of the base verb.
Zucchi (1993, *The Language of Propositions and Events*, Kluwer) analyses
nominalized propositional complements.

---

## 26. Phrasal Verb Status

Some clause-embedding predicates are phrasal verbs — multi-word forms consisting
of a base verb and a particle or preposition, whose combined meaning is not
transparently compositional. Examples in the database include *find_out*,
*turn_out*, *make_out*, *rule_out*, *point_out*, *come_to*.

> (80)  a.  She **found out** [that he had left].  
>       b.  It **turned out** [that the bridge was unsafe].  
>       c.  She **made out** [that everything was fine].  
>       d.  He **pointed out** [that the figures were incorrect].

**Tests.** (a) Can the particle be separated from the base verb by an intervening
NP (*find it out*)? (b) Is the combined meaning non-compositional relative to its
parts? (c) Does the predicate passivise as a unit?

**What it shows.** Phrasal status is primarily a morphosyntactic annotation
flagging multi-word lexical entries. In terms of complement-taking behaviour,
phrasal verbs generally pattern with their non-phrasal near-synonyms: *find_out*
(semi-factive, responsive) patterns with *discover*; *turn_out* (raising-evidential)
patterns with *emerge*; *make_out* (non-factive communicative) patterns with
*claim*. The annotation is therefore useful for identifying multi-word entries
and for avoiding spurious comparisons of phrasal and simplex forms in corpus
work.

**Literature.** Jackendoff (2002, *Foundations of Language*, Oxford UP) discusses
the lexical status of phrasal verbs and their argument-structure properties.
Fraser (1976, *The Verb-Particle Combination in English*, Academic Press) provides
a systematic description. The `phrasal` column codes 1 for phrasal verbs,
0 for simplex verbs.

---

## 27. Copular (Be + Adjective/Noun) Constructions

Several clause-embedding predicates in the database are copular predicates —
predicative phrases consisting of the copula *be* and an adjective or nominal:
*be_certain*, *be_sure*, *be_aware*, *be_convinced*, *be_unaware*,
*be_conscious*. These are listed as single lexical items (with underscore
notation) because their complement-taking properties are associated with the
adjectival head, not with the copula.

> (81)  a.  She **is certain** [that he will come].  
>       b.  She **is sure** [that the proposal was correct].  
>       c.  She **is aware** [that the situation has changed].  
>       d.  She **is unaware** [that the meeting was cancelled].

**Tests.** (a) Does the predicate consist of copula + adjective/noun? (b) Does it
take a finite clausal complement in the same way as a comparable verbal predicate?
(c) Does it participate in the raising alternation (*She is certain to come* —
raising; *She is certain that she will come* — propositional attitude)?

**What it shows.** Several copular predicates in the comprehend class (§1.1 of
`verb_classes.md`) participate marginally in the raising alternation (*She is
certain / sure to win*), distinguishing them from the corresponding verbal
predicates. The annotation flags this morphosyntactic difference and signals
that complement-selection properties are associated with the adjectival
rather than the verbal component of the predicate.

**Literature.** Noonan (1985, *Complementation*, in Shopen ed., *Language
Typology and Syntactic Description*, Cambridge UP) discusses adjectival and
nominal predicates as complement-takers. Moltmann (2003, *Propositional Attitudes
without Propositions*, *Synthese* 135:1) analyses attitudinal adjectives.
The `be_copula` column codes 1 for copular predicates, 0 for simplex verbals.
