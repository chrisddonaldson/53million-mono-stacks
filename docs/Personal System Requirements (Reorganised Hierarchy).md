Here is your **fully updated, cleanly structured, integrated User Story Specification**, including all your edits, expansions, and new notes.  
I have **merged everything**, clarified the updated journal concepts, added the **finance bot**, **Cronobot**, **household chores**, **Mealie**, **body fat measurement app**, and ensured all sections remain internally consistent.

If you'd like, I can also generate:  
✅ System architecture  
✅ Data models  
✅ API designs  
✅ Automation workflows  
✅ UI/UX mockups  
…but for now, here is the **updated User Story list**:

---

# **Updated Unified User Story Specification**

---

# **1. Dashboard & Goals**

## **1.1 Personal Goals Dashboard**

_As Chris, I want a personal goals dashboard, so that I can see all my major objectives and track my progress in one place._

## **1.2 Daily Fitness Checklist**

_As Chris, I want a daily fitness checklist, so that I never forget the habits required to reach my goals._

## **1.3 Finance Overview (NEW)**

_As Chris, I want to see an up-to-date view of my finances, so that I have clear awareness of my spending and budgets._

---

# **2. Training & Workouts**

## **2.1 Workout Guidance**

### **2.1.1 Today’s Workout**

_As Chris, I want to know what my workout is today, so that I can complete the correct training without confusion._

### **2.1.2 Progressive Training Plan**

_As Chris, I want my workouts to follow a progressively challenging plan, so that I continue improving consistently._

As Chris I want each body part to be hit x3 per week with focused microworkout

- Forearms
- Biceps
- Traps
- Back Vertical
- Back Horizontal 
- Flexors and low core
- Lower back
- Glutes
- Hamstring
- tibula

- Chest
- Triceps
- Shoulders
- core
- quads
- calfs
- Abductors
- Adductors

Then to have time for major lifts too
Squat 
Bench
OHP
Deadlift
Pull ups

Do yoga and stretching every morning and evening
get at least 30min cardio per day



### **2.1.3 Guided Coaching & Timers**

_As Chris, I want guided coaching with timers and instructions, and big clear animated visuals and sounds so that I can follow each workout efficiently and correctly.
_
It should tell me what exercise to do
For how long
How much to lift
How many times
Show me progressions
Call out throughout workout 
Encoraging ai messages, you're doing so good. 
Up down voice over
Sync with my youtube music playlists
Each micro workout has a config to generate the coach
The coach is a webgpu animation, a bit like a wizard flow that walks the user through the workout. 
It has different modes but mostly functions like a tabtta cicires wehere its exercise for x reps and each rep is timed out by the ai. 

Should use game UI layers:
1. Diegetic UI
2. Non-diegetic (HUD) UI
3. Meta
4. system UI


_As Chris, I want a quick-start workout option, so that I can begin training spontaneously._

### **2.1.5 Workout Logging (Hevy)**

_As Chris, I want to log my workouts easily (via Hevy), so that my progress is accurately recorded._

## **2.2 Routine Planning**

### **2.2.1 Weekly Workout Routine Planner**

_As Chris, I want to plan my weekly workout routine, so that I can optimise meals around training load._

### **2.2.2 Gym Kit Reminder**

_As Chris, I want reminders to pack my gym kit the night before, so that I am always prepared._

---

# **3. Nutrition & Meal Planning**

## **3.1 Meal Plan Visibility & Sharing**

### **3.1.1 Daily Meal Plan (Chris)**

_As Chris, I want to know my meal plan today, so that I can prepare or buy the right meals._

### **3.1.2 Shared Meal Plan (Anca)**

_As Anca, I want to know what the meal plan is, so that we can relax and avoid uncertainty._

### **3.1.3 Machine-Readable Meal Plan (Nokkel Bot)**

_As the Nokkel bot, I want to know the meal plan, so that I can fetch groceries and automate preparation._

### **3.1.4 Use Mealie as Recipe Source (NEW)**

_As the meal service, I should use Mealie as the open-source cookbook, since meals are already set up there._

## **3.2 Nutrition Tracking & Guidance**

### **3.2.1 Cronometer Usage Support**

_As Chris, I want help using Cronometer effectively, so that I maintain consistent nutrition tracking._

### **3.2.2 Daily Calorie Goal Calculation**

_As Chris, I want a calculated daily calorie goal, so that I can fuel my training appropriately._

## **3.3 Dietary Preferences**

### **3.3.1 Diet Constraint Enforcement**

_As Chris, I want food recommendations that fit my dietary requirements, so that I stay aligned with my health needs._

## **3.4 Cooking & Meal Variety**

### **3.4.1 Meal Variety**

_As Chris, I want to cook an interesting variety of meals, so that eating remains enjoyable._

### **3.4.2 Prepared Meal Buffer (RimWorld-style)**

_As Chris, I want to prepare meals ahead of time, so that I always have ready-to-eat options like in RimWorld._

### **3.4.3 Cooking Prep Task List**

_As Chris, I want a cooking prep checklist, so that I know which ingredients to prepare for upcoming meals._

---

# **4. Groceries & Inventory Automation**

## **4.1 Inventory Fetching Schedule**

_As Chris, I want the system to fetch inventory items on Wednesdays and Saturdays, so that I know what food I already have._

## **4.2 Check Stock Levels from Inventree**

_As Chris, I want to check Inventree stock levels, so that I know what is running low._

## **4.3 Automatic Shopping List Generation**

_As Chris, I want the system to generate a shopping list automatically, so that I always get the right ingredients._

## **4.4 Automatic Ocado Slot Booking**

_As Chris, I want automatic Ocado delivery slot booking, so groceries arrive when needed._

## **4.5 Automatic Ocado Basket Building**

_As Chris, I want the system to build my Ocado basket automatically, so that I don’t have to do it manually._

## **4.6 Grocery Workflow Completion Confirmation**

_As Chris, I want confirmation when the grocery workflow is complete, so that I know everything was handled._

---

# **5. Body & Health Tracking**

## **5.1 Body Weight Tracking**

_As Chris, I want to track my body weight (multiple times per day), so that I can monitor daily fluctuations._

## **5.2 Body Fat Tracking**

_As Chris, I want to track body fat across multiple measuring sites, so that I gain accurate insight into my physique._  
→ _(NEW)_ _Consider building a dedicated measuring-site tracking app._

## **5.3 Body Measurements Tracking**

_As Chris, I want to track body measurements, so that I understand long-term changes in my physique._

## **5.4 Sleep Tracking**

_As Chris, I want to track my sleep, so that I can optimise recovery and training load._

---

# **6. Journaling**

## **6.1 Infinity Journal (UPDATED)**

_As Chris, I want an Infinity Journal that is actually a WebGL-rendered calendar with smooth scrolling and smart API calls, so that I can navigate my history, metrics, and logs in multiple visualisations._

## **6.2 Bullet Journal (UPDATED)**

_As Chris, I want a touch-focused bullet journal that organises my day and automatically pulls tasks from other services, so that I receive a recommended day setup._

---

# **7. Habits & Environmental Support**

## **7.1 Cronometer Environmental Hooks**

_As Chris, I want environmental hooks for Cronometer, so that I remember to log my food consistently._

## **7.2 Habit Reminders & Streak Tracking**

_As Chris, I want habit reminders and streaks, so that I stay consistent._

---

# **8. Finance Automation (NEW)**

## **8.1 Download Starling Transactions**

_As the finance bot, I want to download the latest Starling transactions, so that finances stay up to date._

## **8.2 Download Amex Transactions**

_As the finance bot, I want to download the latest Amex transactions, so that finances stay up to date._

## **8.3 Transform 3rd-Party Data into Firefly Format**

_As the finance bot, I want to convert raw bank data into Firefly-compatible data, so that it can be imported cleanly._

## **8.4 Upload Transactions One by One**

_As the finance bot, I want to upload transactions individually, so that Firefly receives clean, deduplicated data._

## **8.5 Notify Chris When Transactions Refresh**

_As the finance bot, I want to notify Chris when transactions are updated, so that he stays informed._

## **8.6 Send Finance Report to Chris**

_As the finance bot, I want to send a financial report to Chris, so that he understands spending patterns and budgets._

---

# **9. Household Management (NEW)**

## **9.1 Daily Household Chores Guide**

_As Chris or Anca, I want to know which household chores I should be doing today without feeling overwhelmed, so that the household stays under control._

---

# **10. Cronobot Automations (NEW)**

## **10.1 Hourly Cronometer Scraping**

_As Cronobot, I should scrape Chris’s Cronometer every hour and cache results in a database, so that nutrition data remains current._

## **10.2 Real-Time Nutrition Graph**

_As Chris, I want a real-time graph of my nutrition intake, so that I can see how I’m doing throughout the day._

---

# **11. Homelab Control & Automation**

## **11.1 Security Webcam Monitoring**

_As Chris, I want my homelab to manage and display my security webcam feeds, so that I can easily monitor my home._

## **11.2 Indoor Lighting Control**

_As Chris, I want my homelab to control indoor lighting, so that I can automate ambience and energy usage._

## **11.3 Outdoor Lighting Control**

_As Chris, I want my homelab to control outdoor lighting, so that I can automate external visibility and security._

## **11.4 Alarm System Integration**

_As Chris, I want my homelab to integrate with my alarm system, so that I can arm, disarm, and monitor it centrally._

## **11.5 Heating System Control**

_As Chris, I want my homelab to control the heating system, so that the home stays comfortable and efficient._

## **11.6 Radio / Audio System Control**

_As Chris, I want my homelab to manage my radio/audio system, so that I can centrally control music and announcements._

## **11.7 Self-Hosted Alexa (Local Voice Assistant)**

_As Chris, I want a locally hosted Alexa-style assistant integrated into the homelab, so that I can use voice control privately and offline._

## **11.8 Homelab Integration Layer**

_As Chris, I want all these systems to integrate cleanly with the homelab, so that automations and monitoring work seamlessly across all services._

notes:

Should eventually be able to give commands through a ai chatbot hosted on element and matrix serivces

and story about how my lights come on autpmatically at a certain point of day using the homelab setup, same with the radio.

