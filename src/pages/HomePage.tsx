import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Girl, GoalKey, GoalStep } from "../types";

const GOAL_TITLES: Record<GoalKey, { title: string; icon: string }> = {
  hair_skin: { title: "شعر صحي وبشرة لامعة", icon: "✨" },
  fitness: { title: "جسم رشيق", icon: "🏃‍♀️" },
  mental_health: { title: "صحة نفسية جيدة", icon: "🧘‍♀️" },
  knowledge: { title: "زيادة الثقافة", icon: "📚" },
};

// مراحل نمو النبتة حسب نسبة الإنجاز اليومي
const PLANT_STAGES = ["🌰", "🌱", "🌿", "🪴", "🌸"];

interface StepWithProgress extends GoalStep {
  completed: boolean;
  progressId?: string;
}

export default function HomePage() {
  const [girl, setGirl] = useState<Girl | null>(null);
  const [goals, setGoals] = useState<GoalKey[]>([]);
  const [stepsByGoal, setStepsByGoal] = useState<Record<string, StepWithProgress[]>>({});
  const [loading, setLoading] = useState(true);

  const dayNumber = useMemo(() => {
    if (!girl) return 1;
    const created = new Date(girl.created_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - created.getTime()) / 86400000);
    return (diffDays % 7) + 1;
  }, [girl]);

  useEffect(() => {
    loadEverything();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadEverything() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: girlRow } = await supabase
      .from("girls")
      .select("*")
      .eq("auth_id", user.id)
      .single();
    if (!girlRow) {
      setLoading(false);
      return;
    }
    setGirl(girlRow);

    const { data: girlGoals } = await supabase
      .from("girl_goals")
      .select("goal_key")
      .eq("girl_id", girlRow.id);
    const goalKeys = (girlGoals || []).map((g) => g.goal_key as GoalKey);
    setGoals(goalKeys);

    const created = new Date(girlRow.created_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - created.getTime()) / 86400000);
    const today = (diffDays % 7) + 1;

    const map: Record<string, StepWithProgress[]> = {};
    for (const key of goalKeys) {
      const { data: steps } = await supabase
        .from("goal_steps")
        .select("*")
        .eq("goal_key", key)
        .eq("day_number", today)
        .order("step_order", { ascending: true });

      const { data: progress } = await supabase
        .from("girl_progress")
        .select("*")
        .eq("girl_id", girlRow.id)
        .eq("goal_key", key)
        .eq("day_number", today);

      map[key] = (steps || []).map((s) => {
        const p = (progress || []).find((pr) => pr.step_id === s.id);
        return { ...s, completed: p?.completed || false, progressId: p?.id };
      });
    }
    setStepsByGoal(map);
    setLoading(false);
  }

  async function markDone(goalKey: GoalKey, step: StepWithProgress) {
    if (!girl || step.completed) return;

    if (step.progressId) {
      await supabase
        .from("girl_progress")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", step.progressId);
    } else {
      await supabase.from("girl_progress").insert({
        girl_id: girl.id,
        goal_key: goalKey,
        step_id: step.id,
        day_number: dayNumber,
        completed: true,
        completed_at: new Date().toISOString(),
      });
    }

    setStepsByGoal((prev) => ({
      ...prev,
      [goalKey]: prev[goalKey].map((s) =>
        s.id === step.id ? { ...s, completed: true } : s
      ),
    }));
  }

  const { totalSteps, completedSteps } = useMemo(() => {
    let total = 0;
    let done = 0;
    Object.values(stepsByGoal).forEach((steps) => {
      total += steps.length;
      done += steps.filter((s) => s.completed).length;
    });
    return { totalSteps: total, completedSteps: done };
  }, [stepsByGoal]);

  const plantStageIndex = useMemo(() => {
    if (totalSteps === 0) return 0;
    const ratio = completedSteps / totalSteps;
    return Math.min(
      PLANT_STAGES.length - 1,
      Math.round(ratio * (PLANT_STAGES.length - 1))
    );
  }, [completedSteps, totalSteps]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream text-violet-500">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-cream to-violet-50 pb-24">
      <div className="text-center pt-8 pb-6">
        <p className="text-violet-500 text-sm">اليوم {dayNumber} من 7</p>
        <div className="text-7xl my-3 transition-all duration-500">
          {PLANT_STAGES[plantStageIndex]}
        </div>
        <p className="text-rose-500 text-sm">
          {completedSteps} من {totalSteps} مهام أنجزتيها اليوم
        </p>
      </div>

      <div className="px-4 space-y-5 max-w-md mx-auto">
        {goals.map((goalKey) => (
          <div
            key={goalKey}
            className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4"
          >
            <h3 className="font-semibold text-violet-700 mb-3 flex items-center gap-2">
              <span>{GOAL_TITLES[goalKey].icon}</span>
              {GOAL_TITLES[goalKey].title}
            </h3>
            <div className="space-y-2">
              {(stepsByGoal[goalKey] || []).map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${
                    step.completed ? "bg-rose-50" : "bg-violet-50"
                  }`}
                >
                  <p
                    className={`text-sm flex-1 ${
                      step.completed ? "line-through text-gray-400" : "text-gray-700"
                    }`}
                  >
                    {step.content}
                  </p>
                  <button
                    onClick={() => markDone(goalKey, step)}
                    disabled={step.completed}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${
                      step.completed
                        ? "bg-green-100 text-green-600"
                        : "bg-gradient-to-r from-rose-400 to-violet-400 text-white"
                    }`}
                  >
                    {step.completed ? "✓ تم" : "تم"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
