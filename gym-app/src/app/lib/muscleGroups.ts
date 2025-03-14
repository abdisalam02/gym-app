// Standardized muscle groups with their descriptions
export const muscleGroups = {
  'Chest': 'Pectoralis major and minor muscles in the chest',
  'Back': 'Latissimus dorsi, rhomboids, and trapezius muscles',
  'Shoulders': 'Deltoid muscles (anterior, lateral, and posterior)',
  'Biceps': 'Biceps brachii muscles in the front of the upper arms',
  'Triceps': 'Triceps brachii muscles in the back of the upper arms',
  'Forearms': 'Muscles in the lower arm including brachioradialis',
  'Abs': 'Rectus abdominis, obliques, and transverse abdominis',
  'Quads': 'Quadriceps muscles in the front of the thighs',
  'Hamstrings': 'Hamstring muscles in the back of the thighs',
  'Glutes': 'Gluteus maximus, medius, and minimus muscles',
  'Calves': 'Gastrocnemius and soleus muscles in the lower legs',
  'Full Body': 'Exercises that work multiple major muscle groups',
  'Core': 'Abdominal, oblique, and lower back muscles',
  'Lower Body': 'All muscles in the legs and glutes',
  'Upper Body': 'All muscles in the chest, back, shoulders, and arms',
};

// Standardized equipment types
export const equipmentTypes = {
  'Barbell': 'Standard straight bar used with weight plates',
  'Dumbbell': 'Hand-held weights used individually or in pairs',
  'Kettlebell': 'Cast iron or steel ball with a handle',
  'Machine': 'Fixed resistance training equipment',
  'Cable': 'Pulley system with adjustable resistance',
  'Bodyweight': 'Exercises using only your body weight as resistance',
  'Resistance Band': 'Elastic bands providing variable resistance',
  'Smith Machine': 'Barbell fixed within steel rails',
  'TRX/Suspension': 'Suspension training system using body weight',
  'Medicine Ball': 'Weighted ball used for functional training',
  'Bench': 'Flat, incline, or decline bench for support',
  'Pull-up Bar': 'Horizontal bar for pull-up exercises',
  'Foam Roller': 'Cylindrical foam tool for myofascial release',
  'Stability Ball': 'Large inflatable ball for core and stability training',
  'BOSU Ball': 'Half-ball platform for balance training',
  'Battle Ropes': 'Heavy ropes for dynamic training',
  'Sled': 'Weighted platform for pushing/pulling exercises',
  'None': 'No equipment required',
};

// Function to get standardized muscle group
export function getStandardMuscleGroup(input: string | null): string | null {
  if (!input) return null;
  
  const lowerInput = input.toLowerCase().trim();
  
  // Check for exact matches first (case-insensitive)
  for (const [key, _] of Object.entries(muscleGroups)) {
    if (key.toLowerCase() === lowerInput) {
      return key;
    }
  }
  
  // Check for partial matches
  for (const [key, _] of Object.entries(muscleGroups)) {
    if (lowerInput.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerInput)) {
      return key;
    }
  }
  
  // Special cases
  if (lowerInput.includes('pec')) return 'Chest';
  if (lowerInput.includes('lat')) return 'Back';
  if (lowerInput.includes('delt')) return 'Shoulders';
  if (lowerInput.includes('trap')) return 'Back';
  if (lowerInput.includes('quad')) return 'Quads';
  if (lowerInput.includes('ham')) return 'Hamstrings';
  if (lowerInput.includes('glut')) return 'Glutes';
  if (lowerInput.includes('calf') || lowerInput.includes('calv')) return 'Calves';
  if (lowerInput.includes('ab')) return 'Abs';
  if (lowerInput.includes('core')) return 'Core';
  if (lowerInput.includes('leg')) return 'Lower Body';
  if (lowerInput.includes('arm') && !lowerInput.includes('fore')) return 'Upper Body';
  
  // Return the original if no match found
  return input;
}

// Function to get standardized equipment type
export function getStandardEquipment(input: string | null): string | null {
  if (!input) return null;
  
  const lowerInput = input.toLowerCase().trim();
  
  // Check for exact matches first (case-insensitive)
  for (const [key, _] of Object.entries(equipmentTypes)) {
    if (key.toLowerCase() === lowerInput) {
      return key;
    }
  }
  
  // Check for partial matches
  for (const [key, _] of Object.entries(equipmentTypes)) {
    if (lowerInput.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerInput)) {
      return key;
    }
  }
  
  // Special cases
  if (lowerInput.includes('body weight') || lowerInput.includes('bodyweight')) return 'Bodyweight';
  if (lowerInput.includes('db')) return 'Dumbbell';
  if (lowerInput.includes('bb')) return 'Barbell';
  if (lowerInput.includes('kb')) return 'Kettlebell';
  if (lowerInput.includes('band')) return 'Resistance Band';
  if (lowerInput.includes('suspension')) return 'TRX/Suspension';
  if (lowerInput.includes('none') || lowerInput.includes('n/a')) return 'None';
  
  // Return the original if no match found
  return input;
} 