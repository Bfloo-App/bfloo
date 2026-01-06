#!/usr/bin/env bash
set -euo pipefail

# bfloo uninstall script
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/Bfloo-App/bfloo/main/scripts/uninstall.sh | bash

INSTALL_DIR="${BFLOO_INSTALL_DIR:-$HOME/.bfloo/bin}"
BINARY_NAME="bfloo"

# Colors for output (disabled if not a terminal)
if [[ -t 1 ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  BLUE='\033[0;34m'
  BOLD='\033[1m'
  NC='\033[0m'
else
  RED=''
  GREEN=''
  YELLOW=''
  BLUE=''
  BOLD=''
  NC=''
fi

info() {
  echo -e "${BLUE}${BOLD}info${NC} $1"
}

success() {
  echo -e "${GREEN}${BOLD}success${NC} $1"
}

warn() {
  echo -e "${YELLOW}${BOLD}warn${NC} $1"
}

error() {
  echo -e "${RED}${BOLD}error${NC} $1" >&2
  exit 1
}

# Detect shell and get profile file
get_shell_profile() {
  local shell_name
  shell_name=$(basename "${SHELL:-/bin/bash}")

  case "$shell_name" in
    bash)
      if [[ -f "$HOME/.bashrc" ]]; then
        echo "$HOME/.bashrc"
      elif [[ -f "$HOME/.bash_profile" ]]; then
        echo "$HOME/.bash_profile"
      else
        echo "$HOME/.bashrc"
      fi
      ;;
    zsh)
      echo "${ZDOTDIR:-$HOME}/.zshrc"
      ;;
    fish)
      echo "${XDG_CONFIG_HOME:-$HOME/.config}/fish/config.fish"
      ;;
    *)
      echo "$HOME/.profile"
      ;;
  esac
}

# Remove PATH entry from shell profile
remove_from_path() {
  local profile_file
  profile_file=$(get_shell_profile)

  if [[ ! -f "$profile_file" ]]; then
    return 0
  fi

  # Check if our PATH entry exists
  if ! grep -q "$INSTALL_DIR" "$profile_file" 2>/dev/null; then
    info "No PATH entry found in $profile_file"
    return 0
  fi

  # Create backup
  cp "$profile_file" "${profile_file}.bfloo-backup"

  # Remove lines containing the install dir and the "# bfloo" comment
  local temp_file
  temp_file=$(mktemp)
  trap 'rm -f "$temp_file"' RETURN

  # Remove the bfloo comment line and the PATH line
  grep -v -E "(^# bfloo$|$INSTALL_DIR)" "$profile_file" > "$temp_file" 2>/dev/null || true
  
  # Remove trailing empty lines that may have been left
  sed -e :a -e '/^\n*$/{$d;N;ba' -e '}' "$temp_file" > "$profile_file" 2>/dev/null || mv "$temp_file" "$profile_file"

  success "Removed PATH entry from $profile_file"
  info "Backup saved to ${profile_file}.bfloo-backup"
}

# Remove binary
remove_binary() {
  if [[ -f "$INSTALL_DIR/$BINARY_NAME" ]]; then
    rm -f "$INSTALL_DIR/$BINARY_NAME"
    success "Removed $INSTALL_DIR/$BINARY_NAME"
  else
    info "Binary not found at $INSTALL_DIR/$BINARY_NAME"
  fi

  # Remove bin directory if empty
  if [[ -d "$INSTALL_DIR" ]] && [[ -z "$(ls -A "$INSTALL_DIR" 2>/dev/null)" ]]; then
    rmdir "$INSTALL_DIR"
    info "Removed empty directory $INSTALL_DIR"
  fi

  # Remove .bfloo directory if empty
  local bfloo_dir
  bfloo_dir=$(dirname "$INSTALL_DIR")
  if [[ -d "$bfloo_dir" ]] && [[ -z "$(ls -A "$bfloo_dir" 2>/dev/null)" ]]; then
    rmdir "$bfloo_dir"
    info "Removed empty directory $bfloo_dir"
  fi
}

main() {
  echo ""
  echo -e "${BOLD}bfloo uninstaller${NC}"
  echo ""

  # Remove binary
  remove_binary

  # Remove PATH entry
  remove_from_path

  echo ""
  echo -e "${GREEN}${BOLD}Uninstall complete!${NC}"
  echo ""
  echo "You may need to restart your terminal or run:"
  echo ""
  echo -e "  ${BOLD}source $(get_shell_profile)${NC}"
  echo ""
}

main "$@"
