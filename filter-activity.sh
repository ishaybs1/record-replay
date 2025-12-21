#!/bin/bash
# Filter script to remove system noise from Tracee output
# Only keeps user file operations, excludes system files, libraries, and /dev files

while IFS= read -r line; do
  # Skip empty lines
  [ -z "$line" ] && continue

  # Check if line contains pathname in args array
  if echo "$line" | grep -q '"pathname"'; then
    # Extract pathname value from JSON: "name":"pathname"..."value":"..."
    pathname=$(echo "$line" | grep -o '"name":"pathname"[^}]*"value":"[^"]*"' | grep -o '"value":"[^"]*"' | cut -d'"' -f4)

    # If we couldn't extract pathname, print the line (might be an error message)
    if [ -z "$pathname" ]; then
      echo "$line"
      continue
    fi

    # Skip if pathname matches exclusion patterns
    case "$pathname" in
      /dev/*) continue ;;                    # Skip device files
      /etc/*) continue ;;                    # Skip config files
      /usr/*) continue ;;                    # Skip system files
      /lib/*) continue ;;                    # Skip libraries
      /proc/*) continue ;;                   # Skip proc filesystem
      /sys/*) continue ;;                    # Skip sys filesystem
      /run/*) continue ;;                    # Skip runtime files
      /var/*) continue ;;                    # Skip var files
      /snap/*) continue ;;                   # Skip ALL snap directories
      /home/*/snap/*) continue ;;            # Skip snap user directories
      *.so|*.so.*) continue ;;              # Skip shared libraries
      *.cache) continue ;;                   # Skip cache files
      /home/*/.cache/*) continue ;;          # Skip user cache
      /home/*/.local/share/Trash/*) continue ;; # Skip trash
      "") continue ;;                        # Skip empty pathname
    esac
  fi

  # Print the line if it passed all filters
  echo "$line"
done
