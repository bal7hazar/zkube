export enum DifficultyType {
  None = "None",
  VeryEasy = "VeryEasy",
  Easy = "Easy",
  Medium = "Medium",
  MediumHard = "MediumHard",
  Hard = "Hard",
  VeryHard = "VeryHard",
  Expert = "Expert",
  Master = "Master",
}

export const difficultyTypeToNumber = (difficulty: DifficultyType): number => {
  switch (difficulty) {
    case DifficultyType.VeryEasy:
      return 1;
    case DifficultyType.Easy:
      return 2;
    case DifficultyType.Medium:
      return 3;
    case DifficultyType.MediumHard:
      return 4;
    case DifficultyType.Hard:
      return 5;
    case DifficultyType.VeryHard:
      return 6;
    case DifficultyType.Expert:
      return 7;
    case DifficultyType.Master:
      return 8;
    default:
      return 0;
  }
};

export class Difficulty {
  value: DifficultyType;

  constructor(value: DifficultyType) {
    this.value = value;
  }
}
