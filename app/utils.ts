export function getAge(dob: Date) {
  let present = new Date();
  let allYears = present.getFullYear() - dob.getFullYear();
  let partialMonths = present.getMonth() - dob.getMonth();
  if (partialMonths < 0) {
    allYears--;
    partialMonths = partialMonths + 12;
  }
  return allYears + " years " + partialMonths + " months";
}

export function getMinSecs(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60)
  return `${mins}:${secs}`;
}
