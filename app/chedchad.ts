const buffer = Buffer.from('100644 .gitattributes');

// Convert buffer to string to inspect contents (optional, for debugging)
console.log(buffer.toString()); // Should print '100644 .gitattributes'

// Find the index of the first space character
const spaceIndex = buffer.indexOf(' ');

if (spaceIndex !== -1) {
  // Get the sub-buffer from the start to the index of the space character
  const subBuffer = buffer.subarray(0, spaceIndex);

  // Convert the sub-buffer to a string to verify
  console.log(subBuffer.toString()); // Output: '100644'
} else {
  console.log('Space character not found');//
}
