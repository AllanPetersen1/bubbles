/** Ratings run 0.25 to 5.00 in quarter steps. 0 in the UI means "not rated yet". */
export const RATING_STEP = 0.25;
export const RATING_MAX = 5;

/** 4.5 -> "4.5", 4 -> "4.0", 4.25 -> "4.25": one decimal unless a quarter needs two. */
export const formatRating = (value: number) => value.toFixed(2).replace(/0$/, "");
