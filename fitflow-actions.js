// fitflow-actions.js — adds interactive actions for FitFlow site
(function () {
  const modal = document.getElementById('subscribe-modal');
  const form = document.getElementById('subscribe-form');
  const closeBtn = document.getElementById('close-subscribe');
  const toast = document.getElementById('toast');

  function showToast(message, ms = 2200) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), ms);
  }

  function openModal() {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    const input = modal.querySelector('input[type="email"]');
    if (input) input.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  function toggleTheme() {
    const isLight = document.body.classList.toggle('light');
    try {
      localStorage.setItem('ff-theme', isLight ? 'light' : 'dark');
    } catch (e) {}
    showToast(isLight ? 'Light theme enabled' : 'Dark theme enabled', 1400);
  }

  // Restore theme
  try {
    const saved = localStorage.getItem('ff-theme');
    if (saved === 'light') document.body.classList.add('light');
  } catch (e) {}

  // Click delegation for data-action buttons
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest && ev.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'subscribe') {
      openModal();
    } else if (action === 'toggle-theme') {
      toggleTheme();
    } else if (action === 'scroll') {
      const targetId = btn.dataset.target;
      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (action === 'copy') {
      const key = btn.dataset.copy;
      let text = '';
      if (key === 'ProteinTip') text = 'Aim for 20–30 g protein per meal (eggs, chicken, tofu, Greek yogurt).';
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => showToast('Meal tip copied'));
      } else {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); showToast('Meal tip copied'); } catch (e) { showToast('Copy failed'); }
        ta.remove();
      }
    }
  });

  // Modal interactions
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (ev) => {
      if (ev.target === modal) closeModal();
    });
  }

  if (form) {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const data = new FormData(form);
      const email = (data.get('email') || '').toString().trim();
      if (!email) return showToast('Please enter a valid email');
      // Simulate subscription
      showToast('Thanks — check your inbox');
      form.reset();
      closeModal();
    });
  }

  // Close modal with Escape
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeModal();
  });

  // Ripple effect for buttons
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest && ev.target.closest('button');
    if (!btn) return;
    // create ripple
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height) * 0.9;
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (ev.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (ev.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });

  // Click / keyboard support for clickable cards that scroll to another section
  function scrollToSectionId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('highlight-flash');
    setTimeout(() => el.classList.remove('highlight-flash'), 1200);
  }

  document.addEventListener('click', (ev) => {
    const card = ev.target.closest && ev.target.closest('.card.clickable');
    if (!card) return;
    const target = card.dataset.target;
    if (target) {
      ev.preventDefault();
      scrollToSectionId(target);
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      const el = document.activeElement;
      if (el && el.classList && el.classList.contains('card') && el.dataset && el.dataset.target) {
        ev.preventDefault();
        scrollToSectionId(el.dataset.target);
      }
    }
  });
  // --- Gym builder + plan generator ---
  const builderForm = document.getElementById('builder-form');
  const planModal = document.getElementById('plan-result-modal');
  const planResult = document.getElementById('plan-result');
  const closePlan = document.getElementById('close-plan');

  // Live BMI helper for profile inputs (updates small helper text)
  function updateBMIForForm(form, outId) {
    try {
      const out = document.getElementById(outId);
      if (!form || !out) return;
      const weight = Number((form.querySelector('[name="weight"]') || form.querySelector('[name="n_weight"]') || {}).value || 0);
      const height = Number((form.querySelector('[name="height"]') || form.querySelector('[name="n_height"]') || {}).value || 0);
      if (weight > 0 && height > 0) {
        const hm = height / 100;
        const bmi = weight / (hm * hm);
        let cat = '';
        if (bmi < 18.5) cat = 'Underweight';
        else if (bmi < 25) cat = 'Normal';
        else if (bmi < 30) cat = 'Overweight';
        else cat = 'Obese';
        out.textContent = `BMI: ${bmi.toFixed(1)} — ${cat}`;
      } else {
        out.textContent = '';
      }
    } catch (e) { /* ignore */ }
  }

  // Wire live updates for builder and nutrition forms
  try {
    if (builderForm) {
      builderForm.addEventListener('input', () => updateBMIForForm(builderForm, 'builder-bmi'));
      updateBMIForForm(builderForm, 'builder-bmi');
    }
    const nutritionForm = document.getElementById('nutrition-form');
    if (nutritionForm) {
      nutritionForm.addEventListener('input', () => updateBMIForForm(nutritionForm, 'nutrition-bmi'));
      updateBMIForForm(nutritionForm, 'nutrition-bmi');
    }
  } catch (e) {}

  const EXERCISES = [
    { name: 'Push-Up', group: 'push', equip: ['bodyweight'], img: '' },
    { name: 'Bench Press', group: 'push', equip: ['barbell', 'dumbbells'], img: '' },
    { name: 'Dumbbell Shoulder Press', group: 'push', equip: ['dumbbells'], img: '' },
    { name: 'Tricep Dip', group: 'push', equip: ['bodyweight'], img: '' },
    { name: 'Pull-Up', group: 'pull', equip: ['bodyweight'], img: '' },
    { name: 'Bent-Over Row', group: 'pull', equip: ['barbell', 'dumbbells'], img: '' },
    { name: 'Lat Pulldown', group: 'pull', equip: ['machines'], img: '' },
    { name: 'Bicep Curl', group: 'pull', equip: ['dumbbells', 'barbell'], img: '' },
    { name: 'Squat', group: 'legs', equip: ['barbell', 'dumbbells', 'bodyweight'], img: '' },
    { name: 'Romanian Deadlift', group: 'legs', equip: ['barbell', 'dumbbells'], img: '' },
    { name: 'Lunge', group: 'legs', equip: ['bodyweight', 'dumbbells'], img: '' },
    { name: 'Leg Press', group: 'legs', equip: ['machines'], img: '' },
    { name: 'Plank', group: 'core', equip: ['bodyweight'], img: '' },
    { name: 'Hanging Leg Raise', group: 'core', equip: ['bodyweight'], img: '' },
    { name: 'Mountain Climbers', group: 'conditioning', equip: ['bodyweight'], img: '' },
    { name: 'Rowing (machine)', group: 'conditioning', equip: ['machines'], img: '' }
    ,
    { name: 'Incline Push-Up', group: 'push', equip: ['bodyweight'], img: '' },
    { name: 'Chest Press (machine)', group: 'push', equip: ['machines'], img: '' },
    { name: 'Cable Fly', group: 'push', equip: ['machines'], img: '' },
    { name: 'Seated Dumbbell Press', group: 'push', equip: ['dumbbells'], img: '' },
    { name: 'Chest-Supported Row', group: 'pull', equip: ['machines','dumbbells'], img: '' },
    { name: 'Seated Row', group: 'pull', equip: ['machines'], img: '' },
    { name: 'Assisted Pull-Up', group: 'pull', equip: ['machines','bands'], img: '' },
    { name: 'TRX Row', group: 'pull', equip: ['bands','bodyweight'], img: '' },
    { name: 'Face Pull', group: 'pull', equip: ['cables','bands','machines'], img: '' },
    { name: 'Glute Bridge', group: 'legs', equip: ['bodyweight','dumbbells'], img: '' },
    { name: 'Hip Thrust', group: 'legs', equip: ['dumbbells','barbell','machines'], img: '' },
    { name: 'Step-Up', group: 'legs', equip: ['bodyweight','dumbbells'], img: '' },
    { name: 'Bulgarian Split Squat', group: 'legs', equip: ['bodyweight','dumbbells'], img: '' },
    { name: 'Single-Leg Romanian Deadlift', group: 'legs', equip: ['dumbbells'], img: '' },
    { name: 'Calf Raise', group: 'legs', equip: ['bodyweight','machines'], img: '' },
    { name: 'Leg Extension', group: 'legs', equip: ['machines'], img: '' },
    { name: 'Hamstring Curl', group: 'legs', equip: ['machines'], img: '' },
    { name: 'Farmer\'s Carry', group: 'conditioning', equip: ['dumbbells','kettlebell'], img: '' },
    { name: 'Kettlebell Swing', group: 'conditioning', equip: ['kettlebell'], img: '' },
    { name: 'Band Pull-Apart', group: 'pull', equip: ['bands'], img: '' },
    { name: 'TRX Chest Press', group: 'push', equip: ['bands','bodyweight'], img: '' },
    { name: 'Pallof Press', group: 'core', equip: ['bands','machines'], img: '' },
    { name: 'Side Plank', group: 'core', equip: ['bodyweight'], img: '' },
    { name: 'Walking Lunge', group: 'legs', equip: ['bodyweight','dumbbells'], img: '' }
  ];

  // Simple meals dataset (public / permissive images via Unsplash source)
  const MEALS = [
    { name: 'Oatmeal with Berries', tags: ['omnivore','vegetarian','vegan'], calories: 350, protein: 12, carbs: 55, fat: 8, ingredients: ['oats','berries','almond milk'], demo: '', imgQuery: 'oatmeal', recipe: [
      'Combine 1/2 cup rolled oats with 1 cup almond milk in a small pot.',
      'Bring to a simmer over medium heat, stirring occasionally, until thickened (about 5 minutes).',
      'Stir in a handful of fresh or frozen berries and a pinch of salt.'] },
    { name: 'Greek Yogurt Bowl', tags: ['omnivore','vegetarian'], calories: 320, protein: 20, carbs: 35, fat: 10, ingredients: ['greek yogurt','honey','nuts'], demo: '', imgQuery: 'yogurt bowl', recipe: [
      'Spoon 1 cup plain Greek yogurt into a bowl.',
      'Top with sliced fruit (banana or berries), a tablespoon of honey, and a small handful of chopped nuts.'] },
    { name: 'Grilled Chicken & Veggies', tags: ['omnivore','pescatarian'], calories: 520, protein: 42, carbs: 45, fat: 14, ingredients: ['chicken','broccoli','sweet potato'], demo: '', imgQuery: 'grilled chicken', recipe: [
      'Season a chicken breast with salt, pepper, and a little olive oil.',
      'Grill or pan-sear over medium-high heat 6–8 minutes per side until cooked through.',
      'Roast or steam broccoli and roast cubed sweet potato tossed with a little oil.'] },
    { name: 'Quinoa Salad', tags: ['omnivore','vegetarian','vegan'], calories: 410, protein: 14, carbs: 58, fat: 12, ingredients: ['quinoa','beans','vegetables'], demo: '', imgQuery: 'quinoa salad', recipe: [
      'Cook quinoa and let cool.',
      'Toss with beans, chopped vegetables and a simple lemon-olive oil dressing.'] },
    { name: 'Tofu Stir-Fry', tags: ['vegetarian','vegan'], calories: 450, protein: 22, carbs: 38, fat: 18, ingredients: ['tofu','mixed veg','soy sauce'], demo: '', imgQuery: 'tofu stir fry', recipe: [
      'Press and cube tofu and pan-fry until golden.',
      'Stir-fry mixed vegetables and toss with tofu and soy sauce.'] },
    { name: 'Salmon & Rice', tags: ['omnivore','pescatarian'], calories: 560, protein: 38, carbs: 48, fat: 22, ingredients: ['salmon','rice','asparagus'], demo: '', imgQuery: 'salmon rice', recipe: [
      'Season salmon and bake or pan-sear until flaky.',
      'Serve with cooked rice and steamed asparagus.'] },
    { name: 'Lentil Soup', tags: ['vegetarian','vegan'], calories: 300, protein: 18, carbs: 40, fat: 6, ingredients: ['lentils','carrot','onion'], demo: '', imgQuery: 'lentil soup', recipe: [
      'Sauté onion, carrot, and celery; add lentils and stock; simmer until tender.'] },
    { name: 'Avocado Toast', tags: ['omnivore','vegetarian','vegan'], calories: 320, protein: 8, carbs: 30, fat: 18, ingredients: ['bread','avocado','egg optional'], demo: '', imgQuery: 'avocado toast', recipe: [
      'Toast whole-grain bread and top with mashed avocado, lemon, salt.'] },
    { name: 'Protein Smoothie', tags: ['omnivore','vegetarian','vegan'], calories: 380, protein: 28, carbs: 40, fat: 6, ingredients: ['banana','protein powder','milk'], demo: '', imgQuery: 'protein smoothie', recipe: [
      'Blend banana, protein powder, milk and ice until smooth.'] },
    { name: 'Turkey Wrap', tags: ['omnivore'], calories: 420, protein: 32, carbs: 38, fat: 12, ingredients: ['turkey','wrap','lettuce'], demo: '', imgQuery: 'turkey wrap', recipe: [
      'Layer sliced turkey, lettuce, and tomato on a whole-grain wrap; roll and slice.'] },
    { name: 'Chickpea Curry', tags: ['vegetarian','vegan'], calories: 460, protein: 16, carbs: 56, fat: 16, ingredients: ['chickpeas','tomato','spices'], demo: '', imgQuery: 'chickpea curry', recipe: [
      'Sauté onion and spices, add chickpeas and tomatoes, simmer 10-15 minutes.'] },
    { name: 'Tuna Salad', tags: ['omnivore','pescatarian'], calories: 340, protein: 30, carbs: 10, fat: 18, ingredients: ['tuna','leafy greens','olive oil'], demo: '', imgQuery: 'tuna salad', recipe: [
      'Mix tuna with olive oil and lemon; serve over mixed greens.'] },
    { name: 'Egg Scramble with Veg', tags: ['omnivore','vegetarian'], calories: 300, protein: 22, carbs: 6, fat: 20, ingredients: ['eggs','spinach','tomato'], demo: '', imgQuery: 'egg scramble', recipe: [
      'Whisk eggs and scramble with chopped spinach and tomato until set.'] },
    { name: 'Beef Stir-Fry', tags: ['omnivore'], calories: 480, protein: 36, carbs: 30, fat: 20, ingredients: ['beef','broccoli','soy sauce'], demo: '', imgQuery: 'beef stir fry', recipe: [
      'Slice beef thin, sear in a hot pan, add vegetables and sauce; cook until done.'] },
    { name: 'Shrimp Tacos', tags: ['omnivore','pescatarian'], calories: 420, protein: 28, carbs: 40, fat: 12, ingredients: ['shrimp','tortilla','cabbage'], demo: '', imgQuery: 'shrimp tacos', recipe: [
      'Season and sear shrimp; assemble in tortillas with slaw and salsa.'] },
    { name: 'Pasta with Tomato & Turkey', tags: ['omnivore'], calories: 560, protein: 36, carbs: 60, fat: 18, ingredients: ['pasta','tomato sauce','turkey mince'], demo: '', imgQuery: 'pasta tomato turkey', recipe: [
      'Cook pasta; brown turkey mince with sauce; combine and serve.'] },
    { name: 'Black Bean Burrito Bowl', tags: ['omnivore','vegetarian','vegan'], calories: 500, protein: 20, carbs: 70, fat: 12, ingredients: ['black beans','rice','corn'], demo: '', imgQuery: 'burrito bowl', recipe: [
      'Layer rice, beans, corn and salsa in a bowl; top with avocado if desired.'] },
    { name: 'Veggie Omelette', tags: ['vegetarian'], calories: 330, protein: 20, carbs: 8, fat: 22, ingredients: ['eggs','bell pepper','mushroom'], demo: '', imgQuery: 'vegetable omelette', recipe: [
      'Whisk eggs and pour over sautéed vegetables; fold when set.'] },
    { name: 'Cottage Cheese & Fruit', tags: ['omnivore','vegetarian'], calories: 220, protein: 18, carbs: 18, fat: 6, ingredients: ['cottage cheese','fruit'], demo: '', imgQuery: 'cottage cheese', recipe: [
      'Spoon cottage cheese into a bowl and top with sliced fruit and a drizzle of honey.'] },
    { name: 'Pancakes (Protein)', tags: ['omnivore','vegetarian'], calories: 420, protein: 24, carbs: 50, fat: 10, ingredients: ['oats','egg','protein powder'], demo: '', imgQuery: 'protein pancakes', recipe: [
      'Blend oats, egg and protein powder; cook small pancakes on a non-stick pan.'] },
    { name: 'Baked Sweet Potato & Tuna', tags: ['omnivore','pescatarian'], calories: 380, protein: 28, carbs: 46, fat: 6, ingredients: ['sweet potato','tuna','yogurt'], demo: '', imgQuery: 'sweet potato tuna', recipe: [
      'Bake sweet potato until tender; top with flaked tuna mixed with yogurt and herbs.'] },
    { name: 'Mushroom Risotto (veg)', tags: ['vegetarian'], calories: 480, protein: 12, carbs: 70, fat: 14, ingredients: ['rice','mushroom','parmesan'], demo: '', imgQuery: 'mushroom risotto', recipe: [
      'Sauté mushrooms; gradually add stock to rice while stirring until creamy; finish with parmesan.'] },
    { name: 'Soba Noodle Salad', tags: ['vegetarian','vegan'], calories: 360, protein: 12, carbs: 60, fat: 8, ingredients: ['soba','veg','sesame'], demo: '', imgQuery: 'soba noodle salad', recipe: [
      'Cook soba, rinse cold; toss with chopped vegetables and a sesame-soy dressing.'] },
    { name: 'Paneer Curry', tags: ['vegetarian'], calories: 520, protein: 28, carbs: 30, fat: 28, ingredients: ['paneer','tomato','spices'], demo: '', imgQuery: 'paneer curry', recipe: [
      'Sauté onions and spices; add tomato and paneer; simmer briefly.'] },
    { name: 'Pork Tenderloin & Quinoa', tags: ['omnivore'], calories: 540, protein: 42, carbs: 46, fat: 16, ingredients: ['pork','quinoa','greens'], demo: '', imgQuery: 'pork tenderloin', recipe: [
      'Roast pork tenderloin and serve sliced over cooked quinoa and greens.'] },
    { name: 'Eggplant Parmesan', tags: ['vegetarian'], calories: 460, protein: 22, carbs: 40, fat: 20, ingredients: ['eggplant','tomato','mozzarella'], demo: '', imgQuery: 'eggplant parmesan', recipe: [
      'Bread and bake eggplant slices; layer with sauce and cheese and bake until bubbly.'] },
    { name: 'Beef Chili', tags: ['omnivore'], calories: 520, protein: 36, carbs: 40, fat: 22, ingredients: ['beef','beans','tomato'], demo: '', imgQuery: 'beef chili', recipe: [
      'Brown beef, add beans, tomatoes and spices; simmer 30 minutes.'] },
    { name: 'Greek Salad with Feta', tags: ['vegetarian'], calories: 300, protein: 10, carbs: 14, fat: 22, ingredients: ['tomato','cucumber','feta'], demo: '', imgQuery: 'greek salad', recipe: [
      'Chop vegetables and toss with feta, olives and olive oil.'] },
    { name: 'Chia Pudding', tags: ['vegetarian','vegan'], calories: 260, protein: 8, carbs: 28, fat: 12, ingredients: ['chia seeds','milk','fruit'], demo: '', imgQuery: 'chia pudding', recipe: [
      'Mix chia seeds with milk and refrigerate overnight; top with fruit.'] },
    { name: 'Stuffed Peppers', tags: ['omnivore','vegetarian'], calories: 420, protein: 18, carbs: 48, fat: 14, ingredients: ['pepper','rice','cheese'], demo: '', imgQuery: 'stuffed peppers', recipe: [
      'Fill halved peppers with cooked rice and veggies (or mince); bake until tender.'] },
    { name: 'Miso Soup with Tofu', tags: ['vegetarian','vegan'], calories: 140, protein: 10, carbs: 8, fat: 6, ingredients: ['miso','tofu','seaweed'], demo: '', imgQuery: 'miso soup', recipe: [
      'Add miso paste to hot water, add tofu cubes and wakame, warm gently.'] },
    { name: 'Grain Bowl with Tempeh', tags: ['vegetarian','vegan'], calories: 520, protein: 26, carbs: 60, fat: 16, ingredients: ['tempeh','brown rice','veg'], demo: '', imgQuery: 'tempeh bowl', recipe: [
      'Pan-fry tempeh, assemble over grains with roasted vegetables and dressing.'] },
    { name: 'Smoked Salmon Bagel', tags: ['omnivore','pescatarian'], calories: 480, protein: 28, carbs: 46, fat: 18, ingredients: ['bagel','smoked salmon','cream cheese'], demo: '', imgQuery: 'smoked salmon bagel', recipe: [
      'Toast bagel, spread cream cheese and top with smoked salmon and capers.'] },
    { name: 'Vegetable Frittata', tags: ['vegetarian'], calories: 340, protein: 20, carbs: 10, fat: 22, ingredients: ['eggs','zucchini','onion'], demo: '', imgQuery: 'vegetable frittata', recipe: [
      'Sauté vegetables, pour whisked eggs and bake until set.'] },
    { name: 'Baked Cod & Veggies', tags: ['omnivore','pescatarian'], calories: 360, protein: 34, carbs: 20, fat: 12, ingredients: ['cod','vegetables','lemon'], demo: '', imgQuery: 'baked cod', recipe: [
      'Season cod and bake with mixed vegetables until cooked through.'] },
    { name: 'Mediterranean Tuna Pasta', tags: ['omnivore','pescatarian'], calories: 520, protein: 34, carbs: 62, fat: 12, ingredients: ['pasta','tuna','tomato'], demo: '', imgQuery: 'tuna pasta', recipe: [
      'Cook pasta, toss with tuna, tomatoes, olives and olive oil.'] }
  ];

  function shuffle(arr) { return arr.slice().sort(() => Math.random() - 0.5); }

  function pickExercises(groups, equipment, count, profile) {
    let pool = EXERCISES.filter(e => groups.includes(e.group) && e.equip.some(x => equipment.includes(x)));
    // Personalize for older users or special conditions
    try {
      const age = profile && Number(profile.age) ? Number(profile.age) : null;
      const exp = profile && profile.experience ? profile.experience : null;
      if (age && age >= 60) {
        // avoid highest-load barbell-only exercises for older clients by preferring machines/dumbbells/bodyweight
        pool = pool.filter(e => {
          const name = (e.name||'').toLowerCase();
          const disallowByName = ['bench press','deadlift','romanian deadlift','back squat','squat','overhead press'];
          if (disallowByName.some(d => name.includes(d))) return false;
          // prefer non-barbell equipment where possible
          if (e.equip.includes('barbell') && !e.equip.includes('dumbbells') && !e.equip.includes('machines')) return false;
          return true;
        });
      }
      // For beginners, prefer simpler, lower-skill moves
      if (exp === 'beginner') {
        pool = pool.filter(e => !/(snatch|clean|jerk|pistol)/i.test(e.name));
      }
    } catch (e) {}
    return shuffle(pool).slice(0, Math.max(1, count));
  }

  function planRepsSets(goal, experience) {
    if (goal === 'strength') {
      return experience === 'beginner' ? { sets: 3, repRange: '4-6' } : { sets: 4, repRange: '3-5' };
    }
    if (goal === 'hypertrophy') {
      return experience === 'beginner' ? { sets: 3, repRange: '8-12' } : { sets: 4, repRange: '8-12' };
    }
    // fatloss / conditioning
    return experience === 'beginner' ? { sets: 3, repRange: '10-15' } : { sets: 4, repRange: '12-20' };
  }

  function generatePlan({ goal, experience, days, equipment, profile }) {
    days = Math.max(1, Math.min(6, Number(days) || 3));
    const plan = [];
    // simple split logic
    if (days <= 3) {
      // full body each day
      for (let d = 1; d <= days; d++) {
        const groups = ['push','pull','legs'];
        const exercises = pickExercises(groups, equipment, 5, profile);
        plan.push({ name: `Day ${d} — Full Body`, exercises });
      }
    } else if (days === 4) {
      const split = ['Upper','Lower','Upper','Lower'];
      for (let i = 0; i < 4; i++) {
        const groups = split[i].includes('Upper') ? ['push','pull','core'] : ['legs','core'];
        const exercises = pickExercises(groups, equipment, split[i].includes('Upper') ? 5 : 4, profile);
        plan.push({ name: `Day ${i+1} — ${split[i]}`, exercises });
      }
    } else {
      // 5+ days: push/pull/legs + accessory
      const order = ['Push','Pull','Legs','Full Body','Conditioning'].slice(0, days);
      order.forEach((title, i) => {
        const groups = title === 'Push' ? ['push'] : title === 'Pull' ? ['pull'] : title === 'Legs' ? ['legs'] : title === 'Conditioning' ? ['conditioning'] : ['push','pull','legs'];
        const exercises = pickExercises(groups, equipment, title === 'Conditioning' ? 4 : 5, profile);
        plan.push({ name: `Day ${i+1} — ${title}`, exercises });
      });
    }

    // attach sets/reps
    let sr = planRepsSets(goal, experience);
    // adjust intensity for older users or special conditions
    try {
      const age = profile && Number(profile.age) ? Number(profile.age) : null;
      const bf = profile && Number(profile.bodyfat) ? Number(profile.bodyfat) : null;
      if (age && age > 55) sr = { sets: Math.max(2, sr.sets - 1), repRange: sr.repRange };
      if (bf && bf > 28) {
        // prefer a bit more conditioning: if short week, append a conditioning day
        if (days < 5) {
          plan.push({ name: `Day ${plan.length+1} — Conditioning`, exercises: pickExercises(['conditioning'], equipment, 4, profile) });
        }
      }
    } catch (e) {}
    plan.forEach(day => {
      day.exercises = day.exercises.map(ex => ({ name: ex.name, sets: sr.sets, reps: sr.repRange, group: ex.group }));
    });
    return plan;
  }

  function createExerciseNode(ex) {
    const wrapper = document.createElement('div');
    wrapper.className = 'exercise-card';
    const title = document.createElement('div');
    title.style.marginTop = '0.45rem';
    title.style.fontWeight = '600';
    title.textContent = ex.name;
    const meta = document.createElement('div');
    meta.style.color = 'var(--muted)';
    meta.style.fontSize = '0.9rem';
    meta.textContent = `${ex.sets} sets · ${ex.reps} reps`;
    const link = document.createElement('a');
    const demo = ex.demo || `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' exercise')}`;
    link.href = demo; link.target = '_blank'; link.rel = 'noopener';
    link.textContent = 'Watch demo';
    link.style.display = 'inline-block'; link.style.marginTop = '0.45rem'; link.style.color = 'var(--accent)'; link.style.fontWeight = '600';
    wrapper.appendChild(title); wrapper.appendChild(meta); wrapper.appendChild(link);
    return wrapper;
  }

  function createMealNode(meal) {
    const wrapper = document.createElement('div');
    wrapper.className = 'exercise-card';
    const title = document.createElement('div'); title.style.marginTop = '0.45rem'; title.style.fontWeight = '600'; title.textContent = meal.name;
    const meta = document.createElement('div'); meta.style.color = 'var(--muted)'; meta.style.fontSize = '0.9rem'; meta.textContent = `${meal.calories} kcal`;
    const ing = document.createElement('div'); ing.style.color = 'var(--muted)'; ing.style.fontSize = '0.85rem'; ing.textContent = 'Ingredients: ' + (meal.ingredients || []).slice(0,4).join(', ');
    // Inline recipe details (toggle)
    const details = document.createElement('details');
    details.style.marginTop = '0.5rem';
      const summary = document.createElement('summary'); summary.textContent = 'Show Recipe'; summary.style.cursor = 'pointer'; summary.style.fontWeight = '700'; summary.style.color = 'var(--accent)';
      details.appendChild(summary);
      const rec = document.createElement('div'); rec.style.marginTop = '0.5rem'; rec.style.color = 'var(--muted)'; rec.style.fontSize = '0.9rem';
      if (meal.recipe && Array.isArray(meal.recipe)) {
        const ol = document.createElement('ol'); meal.recipe.forEach(step => { const li = document.createElement('li'); li.textContent = step; ol.appendChild(li); }); rec.appendChild(ol);
      } else if (meal.recipe) {
        rec.textContent = meal.recipe;
      } else {
        rec.textContent = 'Simple recipe: combine ingredients and cook to taste.';
      }
      details.appendChild(rec);
      wrapper.appendChild(title); wrapper.appendChild(meta); wrapper.appendChild(ing); wrapper.appendChild(details);
      return wrapper;
    }

    function renderPlanModal(plan) {
    if (!planModal || !planResult) return;
    planResult.innerHTML = '';
    plan.forEach(day => {
      const dayWrap = document.createElement('div');
      const h = document.createElement('h4'); h.textContent = day.name; h.style.margin = '0.5rem 0 0.4rem';
      dayWrap.appendChild(h);
      const grid = document.createElement('div'); grid.className = 'exercise-grid';
      day.exercises.forEach(ex => grid.appendChild(createExerciseNode(ex)));
      dayWrap.appendChild(grid);
      planResult.appendChild(dayWrap);
    });
    planModal.classList.remove('hidden'); planModal.setAttribute('aria-hidden','false');
  }

  function renderMealModal(mealPlan) {
    if (!planModal || !planResult) return;
    planResult.innerHTML = '';
    // show estimated calories if available
    if (typeof lastMealCalories === 'number') {
      const meta = document.createElement('div'); meta.style.color = 'var(--muted)'; meta.style.marginBottom = '0.6rem'; meta.textContent = `Target calories/day: ${Math.round(lastMealCalories)}`;
      planResult.appendChild(meta);
    }
    mealPlan.forEach((day, i) => {
      const dayWrap = document.createElement('div');
      const h = document.createElement('h4'); h.textContent = `Day ${i+1} — ${day.name}`; h.style.margin = '0.5rem 0 0.4rem';
      dayWrap.appendChild(h);
      const grid = document.createElement('div'); grid.className = 'exercise-grid';
      day.meals.forEach(m => grid.appendChild(createMealNode(m)));
      dayWrap.appendChild(grid);

      // compute totals for the day
      try {
        const dayTotal = (day.meals || []).reduce((s,m) => s + (m.calories || 0), 0);
        const macros = (day.meals || []).reduce((acc,m) => { acc.p += (m.protein||0); acc.c += (m.carbs||0); acc.f += (m.fat||0); return acc; }, {p:0,c:0,f:0});
        const totalsRow = document.createElement('div'); totalsRow.style.display = 'flex'; totalsRow.style.justifyContent = 'space-between'; totalsRow.style.marginTop = '0.45rem'; totalsRow.style.color = 'var(--muted)';
        const left = document.createElement('div'); left.textContent = `Day total: ${Math.round(dayTotal)} kcal`;
        const right = document.createElement('div'); right.textContent = `P ${Math.round(macros.p)}g · C ${Math.round(macros.c)}g · F ${Math.round(macros.f)}g`;
        totalsRow.appendChild(left); totalsRow.appendChild(right);
        dayWrap.appendChild(totalsRow);
        if (typeof lastMealCalories === 'number') {
          const diff = Math.round(dayTotal - lastMealCalories);
          const diffEl = document.createElement('div'); diffEl.style.color = diff > 0 ? '#fca5a5' : '#86efac'; diffEl.style.fontSize = '0.9rem'; diffEl.style.marginTop = '0.25rem';
          diffEl.textContent = diff === 0 ? 'Matches target' : (diff > 0 ? `Surplus ${diff} kcal` : `Deficit ${Math.abs(diff)} kcal`);
          dayWrap.appendChild(diffEl);
        }
      } catch (e) {}
      planResult.appendChild(dayWrap);
    });
    // Inline grocery list below the meal plan
    try {
      const items = {};
      mealPlan.forEach(day => {
        (day.meals || []).forEach(m => {
          (m.ingredients || []).forEach(ing => { const key = ing.toLowerCase(); items[key] = (items[key]||0)+1; });
        });
      });
      const groceryWrap = document.createElement('div'); groceryWrap.style.marginTop = '1rem';
      const gh = document.createElement('h4'); gh.textContent = 'Grocery List'; gh.style.margin = '0.35rem 0'; groceryWrap.appendChild(gh);
      const gl = document.createElement('div'); gl.style.display = 'grid'; gl.style.gap = '0.35rem';
      Object.keys(items).sort().forEach(k => {
        const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.padding='0.25rem 0';
        const left = document.createElement('label'); left.innerHTML = `<input type="checkbox" style="margin-right:0.5rem"> ${k}`;
        const right = document.createElement('div'); right.textContent = items[k] > 1 ? `${items[k]}x` : '';
        row.appendChild(left); row.appendChild(right); gl.appendChild(row);
      });
      groceryWrap.appendChild(gl);
      const printBtn = document.createElement('button'); printBtn.textContent = 'Print Grocery'; printBtn.className = 'ghost'; printBtn.style.marginTop = '0.6rem';
      printBtn.addEventListener('click', () => {
        const html = `<html><head><title>Grocery List</title></head><body><h3>Grocery List</h3>${gl.innerHTML}</body></html>`;
        const w = window.open('', '_blank'); if (!w) return showToast('Open blocked'); w.document.write(html); w.document.close(); w.print();
      });
      groceryWrap.appendChild(printBtn);
      planResult.appendChild(groceryWrap);
    } catch (e) { /* ignore grocery render errors */ }
    planModal.classList.remove('hidden'); planModal.setAttribute('aria-hidden','false');
  }

  // Enhance generated plans with public images and demo links
  // (no AI / no API key required)
  // Click handlers for new actions
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest && ev.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'select-plan') {
      const plan = btn.dataset.plan || 'starter';
      showToast(`${plan[0].toUpperCase()+plan.slice(1)} plan selected`);
    } else if (action === 'generate-plan') {
      runGeneratePlan();
    } else if (action === 'sample-plan') {
      const plan = generatePlan({ goal: 'hypertrophy', experience: 'beginner', days: 4, equipment: ['dumbbells','bodyweight'] });
      plan.forEach(day => {
        day.exercises = day.exercises.map(e => ({ ...e, demo: `https://www.youtube.com/results?search_query=${encodeURIComponent(e.name + ' exercise')}` }));
      });
      renderPlanModal(plan);
    }
  });

  // Extracted generate routine so we can bind directly and avoid delegation issues
  function runGeneratePlan() {
    if (!builderForm) { console.debug('runGeneratePlan: builderForm missing'); return showToast('Builder not available'); }
    const fd = new FormData(builderForm);
    const goal = fd.get('goal');
    const experience = fd.get('experience');
    const days = fd.get('days') || 3;
    const equipment = [];
    for (const entry of fd.getAll('equip')) equipment.push(entry);
    if (equipment.length === 0) equipment.push('bodyweight');
    const plan = generatePlan({ goal, experience, days, equipment, profile: {
      age: Number(fd.get('age') || 0), bodyfat: Number(fd.get('bodyfat') || 0), experience: experience
    }});
    plan.forEach(day => { day.exercises = day.exercises.map(e => ({ ...e, demo: `https://www.youtube.com/results?search_query=${encodeURIComponent(e.name + ' exercise')}` })); });
    renderPlanModal(plan);
  }

  // Attach direct click listener to the builder button to ensure it fires even if delegation mismatches
  try { document.querySelector('[data-action="generate-plan"]')?.addEventListener('click', (ev) => { ev.stopPropagation(); runGeneratePlan(); }); } catch (e) {}

  // Nutrition: generate meal plan
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest && ev.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'generate-meal-plan') {
      const nf = document.getElementById('nutrition-form');
      if (!nf) return showToast('Nutrition builder not available');
      const fd = new FormData(nf);
      const goal = fd.get('n_goal');
      const diet = fd.get('diet');
      const n_age = Number(fd.get('n_age') || 30);
      const n_sex = fd.get('n_sex') || 'male';
      const n_weight = Number(fd.get('n_weight') || 70);
      const n_height = Number(fd.get('n_height') || 175);
      const n_bodyfat = Number(fd.get('n_bodyfat') || 0);
      const meals = Math.max(1, Math.min(6, Number(fd.get('meals') || 3)));
      const avoid = (fd.get('avoid') || '').toString().toLowerCase().split(',').map(s => s.trim()).filter(Boolean);

      // Calculate more accurate targets (use Katch-McArdle when bodyfat given)
      function calculateNutritionTargets({ weight, height, age, sex, bodyfat, goal }) {
        let bmr = 0;
        if (bodyfat && bodyfat > 0) {
          const lbm = weight * (1 - (bodyfat/100));
          bmr = Math.round(370 + 21.6 * lbm);
        } else {
          // Mifflin-St Jeor
          bmr = Math.round(10 * weight + 6.25 * height - 5 * age + (sex === 'male' ? 5 : -161));
        }
        // activity multiplier default
        let activity = 1.2;
        if (goal === 'muscle') activity = 1.35;
        if (goal === 'fatloss') activity = 1.15;
        const maintenance = Math.round(bmr * activity);
        const calories = goal === 'muscle' ? maintenance + 300 : goal === 'fatloss' ? Math.max(1200, maintenance - 500) : maintenance;
        // protein target (g/kg)
        const protPerKg = goal === 'muscle' ? 2.0 : goal === 'fatloss' ? 2.2 : 1.8;
        const protein_g = Math.round(Math.max(0, protPerKg * weight));
        // fat percent
        const fatPct = goal === 'fatloss' ? 0.22 : goal === 'muscle' ? 0.25 : 0.28;
        const fat_g = Math.round((calories * fatPct) / 9);
        const carbs_g = Math.round(Math.max(0, (calories - (protein_g * 4) - (fat_g * 9)) / 4));
        return { calories, protein_g, carbs_g, fat_g };
      }

      const targets = calculateNutritionTargets({ weight: n_weight, height: n_height, age: n_age, sex: n_sex, bodyfat: n_bodyfat, goal });
      lastMealCalories = targets.calories;
      lastMealTargets = targets;
      // build meal plan: for each day pick `meals` items matching diet and excluding avoids
      const mealPlan = [];
      const perMealTarget = Math.max(200, Math.round(targets.calories / meals));
      // Build a filtered candidate list once and prefer unique meals across the week
      const allCandidates = MEALS.filter(m => (m.tags.includes(diet) || m.tags.includes('omnivore')) && !avoid.some(a => m.ingredients.join(' ').toLowerCase().includes(a)));
      const usedMeals = new Set();
      for (let d = 0; d < 7; d++) {
        const chosen = [];
        for (let i = 0; i < meals; i++) {
          // prefer unused meals first
          let pool = allCandidates.filter(m => !usedMeals.has(m.name));
          if (pool.length === 0) {
            // if we've exhausted unique options, allow reuse
            usedMeals.clear();
            pool = allCandidates.slice();
          }
          // pick meal closest to perMealTarget
          let bestIdx = 0; let bestDiff = Infinity;
          for (let j = 0; j < pool.length; j++) {
            const diff = Math.abs((pool[j].calories || 0) - perMealTarget);
            if (diff < bestDiff) { bestDiff = diff; bestIdx = j; }
          }
          const picked = Object.assign({}, pool[bestIdx]);
          chosen.push(picked);
          usedMeals.add(picked.name);
        }
        mealPlan.push({ name: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d], meals: chosen });
      }
      renderMealModal(mealPlan.slice(0, Math.min(7, 7)));
    } else if (action === 'sample-meal-plan') {
      const sample = [{ name: 'Sample Day', meals: [MEALS[0], MEALS[2], MEALS[5]].map(m => ({ ...m })) }];
      renderMealModal(sample);
    }
  });

  // Click handlers for new actions
  // Shopping cart implementation
  const cart = [];
  let lastMealCalories = null;
  const cartModal = document.getElementById('cart-modal');
  const cartListEl = document.getElementById('cart-list');
  const cartTotalEl = document.getElementById('cart-total');
  const cartCountEl = document.getElementById('cart-count');
  const checkoutForm = document.getElementById('checkout-form');

  function updateCartUI() {
    document.querySelectorAll('#cart-count, .cart-badge').forEach(el => el.textContent = cart.length);
    if (cartListEl) {
      cartListEl.innerHTML = '';
      cart.forEach((item, idx) => {
        const row = document.createElement('div'); row.className = 'cart-item';
        const left = document.createElement('div'); left.textContent = `${item.name} — $${item.price}`;
        const right = document.createElement('div');
        const remove = document.createElement('button'); remove.textContent = 'Remove'; remove.className = 'ghost';
        remove.addEventListener('click', () => { cart.splice(idx,1); updateCartUI(); });
        right.appendChild(remove);
        row.appendChild(left); row.appendChild(right);
        cartListEl.appendChild(row);
      });
    }
    const total = cart.reduce((s, it) => s + Number(it.price || 0), 0);
    if (cartTotalEl) cartTotalEl.textContent = total.toFixed(2);
  }

  function openCart() { if (!cartModal) return; cartModal.classList.remove('hidden'); cartModal.setAttribute('aria-hidden','false'); updateCartUI(); }
  function closeCart() { if (!cartModal) return; cartModal.classList.add('hidden'); cartModal.setAttribute('aria-hidden','true'); if (checkoutForm) checkoutForm.classList.add('hidden'); }

  Array.from(document.querySelectorAll('[data-action="view-cart"], #view-cart')).forEach(el => el.addEventListener('click', (ev) => { ev.stopPropagation(); openCart(); }));
  document.getElementById('close-cart')?.addEventListener('click', closeCart);
  document.getElementById('clear-cart')?.addEventListener('click', () => { cart.length = 0; updateCartUI(); });

  document.getElementById('checkout-open')?.addEventListener('click', () => { if (checkoutForm) checkoutForm.classList.remove('hidden'); });
  document.getElementById('cancel-checkout')?.addEventListener('click', () => { if (checkoutForm) checkoutForm.classList.add('hidden'); });

  document.getElementById('pay-now')?.addEventListener('click', () => {
    // Very basic simulated payment validation
    if (!checkoutForm) return;
    const fd = new FormData(checkoutForm);
    const name = (fd.get('fullname')||'').toString().trim();
    const email = (fd.get('email')||'').toString().trim();
    if (!name || !email) return showToast('Please fill name and email');
    if (cart.length === 0) return showToast('Cart is empty');
    // simulate processing
    showToast('Processing payment...', 1800);
    setTimeout(() => {
      showToast('Payment successful — thank you!', 3000);
      cart.length = 0; updateCartUI(); closeCart();
    }, 1600);
  });

  // Add to cart handler
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest && ev.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    // debug: log actions that reach the delegated handler
    if (action === 'generate-grocery' || action === 'view-cart') console.debug('delegated click action=', action, 'target=', btn);
    if (action === 'add-to-cart') {
      const name = btn.dataset.plan || 'Plan';
      const price = Number(btn.dataset.price || 0);
      cart.push({ name, price });
      updateCartUI();
      showToast(`${name} added to cart`);
    } else if (action === 'generate-grocery') {
      // allow delegated generate only when the clicked element is the explicit grocery button (id present)
      if (btn.id !== 'generate-grocery') { console.debug('ignored delegated generate-grocery from', btn); return; }
      ev.stopPropagation();
      generateGroceryFromCurrentPlan();
    }
  });

  // central grocery generator used by direct listeners and delegated handlers
  function generateGroceryFromCurrentPlan() {
    console.debug('generateGroceryFromCurrentPlan called, currentDisplayedPlan=', currentDisplayedPlan);
    if (!currentDisplayedPlan || currentDisplayedPlan.type !== 'meal') return showToast('Open a meal plan to generate a grocery list');
    const items = {};
    currentDisplayedPlan.data.forEach(day => {
      (day.meals || []).forEach(m => {
        (m.ingredients || []).forEach(ing => { const key = ing.toLowerCase(); items[key] = (items[key]||0)+1; });
      });
    });
    if (groceryListEl) groceryListEl.innerHTML = '';
    Object.keys(items).sort().forEach(k => {
      const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.padding='0.35rem 0';
      const left = document.createElement('label'); left.innerHTML = `<input type="checkbox" style="margin-right:0.5rem"> ${k}`;
      const right = document.createElement('div'); right.textContent = items[k] > 1 ? `${items[k]}x` : '';
      row.appendChild(left); row.appendChild(right); groceryListEl.appendChild(row);
    });
    if (groceryModal) { groceryModal.classList.remove('hidden'); groceryModal.setAttribute('aria-hidden','false'); }
  }

  if (closePlan) closePlan.addEventListener('click', () => { if (planModal) { planModal.classList.add('hidden'); planModal.setAttribute('aria-hidden','true'); } });
  if (planModal) planModal.addEventListener('click', (ev) => { if (ev.target === planModal) { planModal.classList.add('hidden'); planModal.setAttribute('aria-hidden','true'); } });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && planModal && !planModal.classList.contains('hidden')) { planModal.classList.add('hidden'); planModal.setAttribute('aria-hidden','true'); } });

  // --- Sticky nav, reveal, save/load plans, grocery list ---
  const siteNav = document.getElementById('site-nav');
  const navLinks = siteNav ? Array.from(siteNav.querySelectorAll('a[data-scroll-to]')) : [];
  const openMyPlansBtn = document.getElementById('open-my-plans');
  const myPlansModal = document.getElementById('my-plans-modal');
  const myPlansList = document.getElementById('my-plans-list');
  const closeMyPlans = document.getElementById('close-my-plans');
  const savePlanBtn = document.getElementById('save-plan');
  const generateGroceryBtn = document.getElementById('generate-grocery') || document.querySelector('[data-action="generate-grocery"]');
  const groceryModal = document.getElementById('grocery-modal');
  const groceryListEl = document.getElementById('grocery-list');
  const printGroceryBtn = document.getElementById('print-grocery');
  const closeGroceryBtn = document.getElementById('close-grocery');

  let currentDisplayedPlan = null; // { type: 'workout'|'meal', data: [...] }

  // Attach current plan when rendering
  const _renderPlanModal = renderPlanModal;
  renderPlanModal = function(plan) {
    currentDisplayedPlan = { type: 'workout', data: plan };
    _renderPlanModal(plan);
  };

  const _renderMealModal = renderMealModal;
  renderMealModal = function(mealPlan) {
    currentDisplayedPlan = { type: 'meal', data: mealPlan };
    _renderMealModal(mealPlan);
  };

  // Save and load plans to localStorage
  function getSavedPlans() {
    try { return JSON.parse(localStorage.getItem('ff-saved-plans') || '[]'); } catch (e) { return []; }
  }
  function setSavedPlans(list) { try { localStorage.setItem('ff-saved-plans', JSON.stringify(list)); } catch (e) {} }

  function refreshMyPlansUI() {
    if (!myPlansList) return;
    const list = getSavedPlans();
    myPlansList.innerHTML = '';
    if (list.length === 0) { myPlansList.textContent = 'No saved plans yet.'; return; }
    list.forEach((p, i) => {
      const row = document.createElement('div'); row.style.borderBottom = '1px solid var(--border)'; row.style.padding = '0.6rem 0';
      const title = document.createElement('div'); title.style.fontWeight = '700'; title.textContent = p.title || (p.type === 'meal' ? 'Meal Plan' : 'Workout Plan');
      const meta = document.createElement('div'); meta.style.color = 'var(--muted)'; meta.style.fontSize = '0.9rem'; meta.textContent = new Date(p.created).toLocaleString();
      const actions = document.createElement('div'); actions.style.marginTop = '0.45rem';
      const load = document.createElement('button'); load.textContent = 'Load'; load.className = 'ghost'; load.addEventListener('click', () => { if (p.type === 'meal') renderMealModal(p.data); else renderPlanModal(p.data); });
      const download = document.createElement('button'); download.textContent = 'Export'; download.className = 'ghost'; download.addEventListener('click', () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' })); a.download = `${(p.title||'plan')}.json`; document.body.appendChild(a); a.click(); a.remove(); });
      const del = document.createElement('button'); del.textContent = 'Delete'; del.className = 'ghost'; del.addEventListener('click', () => { const arr = getSavedPlans(); arr.splice(i,1); setSavedPlans(arr); refreshMyPlansUI(); });
      actions.appendChild(load); actions.appendChild(download); actions.appendChild(del);
      row.appendChild(title); row.appendChild(meta); row.appendChild(actions);
      myPlansList.appendChild(row);
    });
  }

  if (openMyPlansBtn) openMyPlansBtn.addEventListener('click', () => { if (!myPlansModal) return; refreshMyPlansUI(); myPlansModal.classList.remove('hidden'); myPlansModal.setAttribute('aria-hidden','false'); });
  if (closeMyPlans) closeMyPlans.addEventListener('click', () => { if (!myPlansModal) return; myPlansModal.classList.add('hidden'); myPlansModal.setAttribute('aria-hidden','true'); });

  if (savePlanBtn) savePlanBtn.addEventListener('click', () => {
    if (!currentDisplayedPlan) return showToast('No plan to save');
    const title = prompt('Save plan title', (currentDisplayedPlan.type==='meal'?'Meal Plan':'Workout Plan')) || undefined;
    const list = getSavedPlans();
    list.push({ type: currentDisplayedPlan.type, title, data: currentDisplayedPlan.data, created: Date.now() });
    setSavedPlans(list); showToast('Plan saved');
  });

  // Grocery list generation (from currentDisplayedPlan when meal)
  if (generateGroceryBtn) generateGroceryBtn.addEventListener('click', (ev) => { ev.stopPropagation(); generateGroceryFromCurrentPlan(); });

  if (printGroceryBtn) printGroceryBtn.addEventListener('click', () => {
    const html = `<html><head><title>Grocery List</title></head><body>${groceryListEl.innerHTML}</body></html>`;
    const w = window.open('', '_blank'); if (!w) return showToast('Open blocked'); w.document.write(html); w.document.close(); w.print();
  });
  if (closeGroceryBtn) closeGroceryBtn.addEventListener('click', () => { if (!groceryModal) return; groceryModal.classList.add('hidden'); groceryModal.setAttribute('aria-hidden','true'); });

  // Show sticky nav when scrolling past header and highlight links
  const headerEl = document.querySelector('header');
  if (siteNav && headerEl) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => { siteNav.classList.toggle('hidden', en.isIntersecting); });
    }, { root: null, threshold: 0, rootMargin: '-80px 0px 0px 0px' });
    obs.observe(headerEl);
  }

  // Nav link click -> smooth scroll
  navLinks.forEach(a => a.addEventListener('click', (ev) => { ev.preventDefault(); const target = a.dataset.scrollTo; if (target) scrollToSectionId(target); }));

  // highlight current section in nav
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(ent => {
      const id = ent.target.id;
      const link = navLinks.find(l => l.dataset.scrollTo === id);
      if (link) link.classList.toggle('active', ent.isIntersecting && ent.intersectionRatio > 0.45);
    });
  }, { threshold: [0.25, 0.5, 0.75] });
  sections.forEach(s => sectionObserver.observe(s));

  // reveal on scroll for .card
  document.querySelectorAll('.card').forEach(el => el.classList.add('reveal'));
  const revealObserver = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }); }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(r => revealObserver.observe(r));

})();
