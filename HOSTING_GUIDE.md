# DataSphare: Free Hosting Guide

এই guide-এ GitHub, MongoDB Atlas এবং Render ব্যবহার করে DataSphare-কে free showcase site হিসেবে deploy করার ধাপ আছে। Hosting configuration আগে থেকেই [`render.yaml`](render.yaml)-এ প্রস্তুত করা আছে। Live deployment-এর জন্য আপনার নিজের GitHub, Atlas ও Render account-এ sign in করে নিচের ধাপগুলো সম্পন্ন করতে হবে।

## 1. Source folder সম্পর্কে

বর্তমান frontend-এর Neural Network এবং CNN lesson build `frontend/lessons/neural-network/` ও `frontend/lessons/cnn/`-এর মধ্যে আছে। `frontend/` বা `backend/` code-এ `mlu_source/` কিংবা `cnn-explainer-master/` path reference নেই, তাই ওই দুই source folder সরালেও বর্তমান site চালু থাকার কথা। তবে source-এর ভেতরের license/notice এবং ভবিষ্যতে lesson update করার কাজে লাগতে পারে—তাই এখনই মুছে না দিয়ে archive/backup রাখা ভালো। `.gitignore`-এ folder-গুলো ignore করা আছে, সেগুলো GitHub-এ যাবে না।

## 2. MongoDB Atlas database তৈরি

1. [MongoDB Atlas](https://www.mongodb.com/atlas) account তৈরি করে sign in করুন।
2. একটি organization ও project তৈরি করুন, যেমন `DataSphare Lab`.
3. **Build a Database** / **Create** বেছে নিয়ে **Free (M0)** cluster নির্বাচন করুন। Free option দেখা না গেলে Atlas-এর বর্তমান available cluster option দেখুন; paid option বেছে নেবেন না।
4. Provider/region বাছার সময় Singapore region নিন যদি Atlas-এর Free option-এ পাওয়া যায়। Render config-এ Singapore region সেট করা আছে, তাই দুই service কাছাকাছি থাকবে।
5. Cluster name দিন, যেমন `datasphare-cluster`, এবং cluster create হওয়া পর্যন্ত অপেক্ষা করুন। Atlas-এর [Create Cluster](https://www.mongodb.com/docs/atlas/tutorial/create-new-cluster/) guide-ও দেখুন।
6. Atlas-এ **Database Access** (কখনও **Security → Database Access**) খুলে **Add New Database User** করুন. Username/password আলাদা, strong credentials রাখুন; app-কে `readWrite` access শুধু `datasphare` database-এ দিন। Username/password কাউকে পাঠাবেন না। Connection URI-তে special character password থাকলে URL-encode করতে হয়; সহজতর সেটআপের জন্য password-এ letter/number ব্যবহার করতে পারেন।
7. **Network Access** / **IP Access List**-এ Atlas-এর connection allowlist তৈরি করুন। Atlas-এ app-এর database user ও allowlisted IP—দুটিই লাগে। Render service তৈরি হলে Render Dashboard-এ service খুলে **Connect → Outbound** থেকে তার Singapore outbound CIDR ranges নিন; Atlas IP Access List-এ সেগুলো add করে connection test করুন. Render Free-এ dedicated static IP add-on নেই, shared regional ranges-ই allowlist করতে হয়।

   Blueprint/service create করার আগে ranges পাওয়া না গেলে temporary setup-এ `0.0.0.0/0` allow করে deploy শুরু করা যায়; এতে cluster যেকোনো IP থেকে reachable হয়, তাই database user-এ শক্তিশালী password ও শুধু `datasphare` database-এর `readWrite` permission রাখুন। Service-এর outbound ranges পাওয়ার পর Atlas allowlist থেকে `0.0.0.0/0` সরিয়ে শুধু Render-এর Singapore ranges রাখুন। MongoDB URI কখনো browser code/GitHub-এ রাখবেন না। Atlas-এর [connection prerequisites](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/?interface=atlas-ui) এবং Render-এর [outbound IP ranges](https://render.com/docs/outbound-ip-addresses) guide দেখুন।
8. Cluster-এর **Connect → Drivers → Node.js** থেকে connection string copy করুন। দেখতে এমন হবে:

   ```text
   mongodb+srv://<db-user>:<db-password>@<cluster-host>/datasphare?retryWrites=true&w=majority
   ```

   Atlas যে URI দেয় সেটিই ব্যবহার করুন; `<db-user>` ও `<db-password>`-এর জায়গায় আপনার তৈরি credentials বসান। Database name `datasphare` রাখুন। URI-টি private রাখুন।

## 3. GitHub-এ project পাঠানো

1. GitHub-এ **New repository** তৈরি করুন। Blank repository রাখুন—GitHub থেকে README, `.gitignore` বা license auto-create করবেন না। Repo public করলে code সবার দেখা যাবে; শুধু site showcase করতে চাইলে public repo বাধ্যতামূলক নয়।
2. PowerShell-এ project folder-এ যান:

   ```powershell
   cd D:\DataSphare
   ```

3. প্রথমবারের জন্য Git initialize ও commit করুন:

   ```powershell
   git init
   git add .
   git status --short
   ```

4. `git status` দেখে নিশ্চিত করুন `.env`, `backend/data.json`, `node_modules`, `mlu_source/`, `cnn-explainer-master/`, `legacy-frontend-sources/` staged নয়। এগুলো `.gitignore` দিয়ে বাদ রাখা হয়েছে। `.env`-এ secret থাকলে কখনো GitHub-এ push করবেন না।
5. Commit করে GitHub repo-তে push করুন (`USERNAME` ও `REPO` নিজেরগুলো দিয়ে বদলাবেন):

   ```powershell
   git commit -m "Prepare DataSphare for hosting"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO.git
   git push -u origin main
   ```

   যদি Git identity না থাকে, GitHub account-এর public display name ও email দিয়ে `git config --global user.name "Your Name"` এবং `git config --global user.email "you@example.com"` একবার সেট করুন।

## 4. Render-এ free web service deploy

1. [Render](https://render.com/) account তৈরি করে sign in করুন এবং GitHub account connect/authorize করুন।
2. Dashboard-এ **New → Blueprint** নির্বাচন করুন। Render Blueprint repository-র root-এ থাকা [`render.yaml`](render.yaml) পড়ে service তৈরি করবে।
3. সদ্য push করা DataSphare repository ও `main` branch নির্বাচন করুন। Render-এর [Blueprint flow](https://render.com/docs/infrastructure-as-code) হলো repo connect করে YAML config sync/deploy করা।
4. Blueprint configuration review করুন। Service region Singapore, plan `free`; build command `cd backend && npm ci`, start command `cd backend && npm start`, health path `/api/health` থাকবে। Repo root থেকেই build হওয়ায় frontend file change-ও নতুন deploy trigger করবে; Node app code `backend/`-এ, আর served website `frontend/`-এ থাকবে।
5. প্রথম Blueprint setup-এ `MONGODB_URI` value চাইলে Atlas থেকে কপি করা URI দিন। এটি Render-এর secret/environment variable হিসেবে সংরক্ষিত হবে। **এটি code, chat, README, বা GitHub-এ লিখবেন না।** `JWT_SECRET` Render নিজে generate করবে; `NODE_ENV` ও `TRUST_PROXY` config থেকে আসবে।
6. Free service create/deploy করুন। Build log-এ deploy success হওয়া পর্যন্ত দেখুন; deploy শেষে Render `https://<service-name>.onrender.com` ধরনের URL দেবে।
7. Site ও health endpoint খুলে যাচাই করুন:

   ```text
   https://<service-name>.onrender.com/
   https://<service-name>.onrender.com/api/health
   ```

   Health response-এ `ok: true` ও `storage: "mongodb"` থাকা উচিত। তারপর account register, login, community post, comment, like এবং follow নিজের browser থেকে চেষ্টা করুন।

## 5. পরের বার update প্রকাশ

Code পরিবর্তনের পর:

```powershell
git add .
git commit -m "Describe the update"
git push
```

Render connected branch-এর নতুন commit পেলে redeploy করবে। Atlas-এর data `backend/data.json`-এ নয়, database-এ থাকবে। Local development-এর পুরোনো JSON stories Atlas-এ স্বয়ংক্রিয়ভাবে copy হবে না; production database প্রথমবার খালি থাকলে backend তার sample public stories seed করবে।

## Free plan-এর সীমা

Render Free web service ১৫ মিনিট request না পেলে sleep করে; পরের visitor-এর request-এ wake-up হতে পারে, তাই site-এ প্রথম load প্রায় এক মিনিট lag করতে পারে. Free service local filesystem persistent নয়—community data MongoDB Atlas-এ রাখার কারণ এটাই। [Render Free limits](https://render.com/docs/free) পড়ে নিন। Atlas Free cluster-এর নিজস্ব storage/feature limits আছে; [Atlas limits](https://www.mongodb.com/docs/atlas/reference/limitations/) দেখে নিন।

## Troubleshooting

- **`/api/health` 500 বা service deploy failed:** Render service environment-এ `MONGODB_URI` ঠিক আছে কি না, database username/password মিলে কি না, Atlas IP access list-এ connection allow করা আছে কি না দেখুন।
- **Health-এ `storage: "json"`:** Render-এ `NODE_ENV=production` ও `MONGODB_URI` verify করুন। Production config JSON storage গ্রহণ করবে না।
- **MongoDB authentication failed:** Atlas-এর Database Access user/password যাচাই করুন। Password-এ `@`, `:`, `/`, `#`, `%`-এর মতো URI-reserved character থাকলে সেগুলো URL-encode করুন, অথবা নতুন simple password তৈরি করুন।
- **Frontend খুলছে, কিন্তু API কাজ করছে না:** Render deploy log-এ startup error দেখুন এবং `/api/health` খুলে API status যাচাই করুন।
- **Render service-এর প্রথম response ধীর:** Free service sleep থেকে উঠছে—কিছুক্ষণ অপেক্ষা করে reload করুন।
