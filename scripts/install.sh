#!/usr/bin/env bash
set -euo pipefail

# bfloo install script
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/Bfloo-App/bfloo/main/scripts/install.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/Bfloo-App/bfloo/main/scripts/install.sh | bash -s -- v1.0.0

GITHUB_REPO="Bfloo-App/bfloo"
INSTALL_DIR="${BFLOO_INSTALL_DIR:-$HOME/.bfloo/bin}"
BINARY_NAME="bfloo"

# Blocked versions (space-separated) - versions with known security vulnerabilities
# These versions cannot be installed. Update this list when security issues are found.
# Example: BLOCKED_VERSIONS="v1.0.0 v1.0.1"
BLOCKED_VERSIONS=""

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

# Check if version is blocked due to security vulnerability
check_blocked_version() {
  local version="$1"

  if [[ -z "$BLOCKED_VERSIONS" ]]; then
    return 0
  fi

  for blocked in $BLOCKED_VERSIONS; do
    if [[ "$version" == "$blocked" ]]; then
      error "Version $version has a known security vulnerability and is blocked from installation.\n\nPlease install the latest version instead, or see:\nhttps://github.com/${GITHUB_REPO}/security/advisories"
    fi
  done
}

# Detect OS
detect_os() {
  local os
  os=$(uname -s)
  case "$os" in
    Darwin) echo "darwin" ;;
    Linux) echo "linux" ;;
    MINGW*|MSYS*|CYGWIN*) error "Windows is not yet supported. Please use WSL or check back later." ;;
    *) error "Unsupported operating system: $os" ;;
  esac
}

# Detect architecture
detect_arch() {
  local arch
  arch=$(uname -m)
  case "$arch" in
    x86_64|amd64) echo "x64" ;;
    arm64|aarch64) echo "arm64" ;;
    *) error "Unsupported architecture: $arch" ;;
  esac
}

# Get latest version from GitHub API
get_latest_version() {
  local latest_url="https://api.github.com/repos/${GITHUB_REPO}/releases/latest"
  local version

  if command -v curl &> /dev/null; then
    version=$(curl -fsSL "$latest_url" 2>/dev/null | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
  elif command -v wget &> /dev/null; then
    version=$(wget -qO- "$latest_url" 2>/dev/null | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
  else
    error "Neither curl nor wget found. Please install one of them."
  fi

  if [[ -z "$version" ]]; then
    error "Failed to fetch latest version. Check your internet connection or try specifying a version manually."
  fi

  echo "$version"
}

# Download file with progress indicator
download() {
  local url="$1"
  local dest="$2"

  info "Downloading from $url"

  if command -v curl &> /dev/null; then
    if ! curl -fSL --progress-bar "$url" -o "$dest" 2>&1; then
      error "Failed to download from $url"
    fi
  elif command -v wget &> /dev/null; then
    if ! wget -q --show-progress "$url" -O "$dest" 2>&1; then
      error "Failed to download from $url"
    fi
  else
    error "Neither curl nor wget found. Please install one of them."
  fi
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

# Add to PATH in shell profile
add_to_path() {
  local profile_file
  profile_file=$(get_shell_profile)
  local shell_name
  shell_name=$(basename "${SHELL:-/bin/bash}")
  local path_line

  # Check if already in PATH
  if [[ ":$PATH:" == *":$INSTALL_DIR:"* ]]; then
    info "Already in PATH"
    return 0
  fi

  # Check if already in profile
  if [[ -f "$profile_file" ]] && grep -q "$INSTALL_DIR" "$profile_file" 2>/dev/null; then
    info "PATH entry already exists in $profile_file"
    return 0
  fi

  # Create profile file if it doesn't exist
  if [[ ! -f "$profile_file" ]]; then
    mkdir -p "$(dirname "$profile_file")"
    touch "$profile_file"
  fi

  # Add PATH based on shell
  if [[ "$shell_name" == "fish" ]]; then
    path_line="set -gx PATH \"$INSTALL_DIR\" \$PATH"
  else
    path_line="export PATH=\"$INSTALL_DIR:\$PATH\""
  fi

  {
    echo ""
    echo "# bfloo"
    echo "$path_line"
  } >> "$profile_file"

  success "Added bfloo to PATH in $profile_file"
}

# Verify checksum
verify_checksum() {
  local binary_path="$1"
  local version="$2"
  local os="$3"
  local arch="$4"

  local checksums_url="https://github.com/${GITHUB_REPO}/releases/download/${version}/checksums.txt"
  local expected_name="bfloo-${os}-${arch}"

  # Try to download checksums
  local checksums_file
  checksums_file=$(mktemp)
  trap 'rm -f "$checksums_file"' RETURN

  if ! curl -fsSL "$checksums_url" -o "$checksums_file" 2>/dev/null && \
     ! wget -q "$checksums_url" -O "$checksums_file" 2>/dev/null; then
    warn "Could not download checksums file, skipping verification"
    return 0
  fi

  # Extract expected checksum
  local expected_checksum
  expected_checksum=$(grep "$expected_name" "$checksums_file" 2>/dev/null | awk '{print $1}')

  if [[ -z "$expected_checksum" ]]; then
    warn "Checksum not found for $expected_name, skipping verification"
    return 0
  fi

  # Calculate actual checksum
  local actual_checksum
  if command -v sha256sum &> /dev/null; then
    actual_checksum=$(sha256sum "$binary_path" | awk '{print $1}')
  elif command -v shasum &> /dev/null; then
    actual_checksum=$(shasum -a 256 "$binary_path" | awk '{print $1}')
  else
    warn "sha256sum/shasum not found, skipping verification"
    return 0
  fi

  if [[ "$expected_checksum" != "$actual_checksum" ]]; then
    error "Checksum verification failed!\nExpected: $expected_checksum\nActual: $actual_checksum\n\nThe downloaded file may be corrupted. Please try again."
  fi

  success "Checksum verified"
}

# Cleanup on failure
cleanup() {
  local temp_file="$1"
  if [[ -f "$temp_file" ]]; then
    rm -f "$temp_file"
  fi
}

main() {
  echo ""
  echo -e "${BOLD}bfloo installer${NC}"
  echo ""

  # Parse version argument (optional)
  local version="${1:-}"

  # Detect platform
  local os arch
  os=$(detect_os)
  arch=$(detect_arch)

  info "Detected platform: ${os}-${arch}"

  # Get version
  if [[ -z "$version" ]]; then
    info "Fetching latest version..."
    version=$(get_latest_version)
  fi

  # Check if version is blocked
  check_blocked_version "$version"

  info "Installing version: $version"

  # Construct download URL
  local binary_name="bfloo-${os}-${arch}"
  local download_url="https://github.com/${GITHUB_REPO}/releases/download/${version}/${binary_name}"

  # Create install directory
  mkdir -p "$INSTALL_DIR"

  # Download to temp file first
  local temp_file
  temp_file=$(mktemp)
  trap 'cleanup "$temp_file"' EXIT

  download "$download_url" "$temp_file"

  # Verify checksum
  verify_checksum "$temp_file" "$version" "$os" "$arch"

  # Move to install location
  mv "$temp_file" "$INSTALL_DIR/$BINARY_NAME"
  chmod +x "$INSTALL_DIR/$BINARY_NAME"

  # Clear the trap since we successfully moved the file
  trap - EXIT

  success "Installed bfloo to $INSTALL_DIR/$BINARY_NAME"

  # Add to PATH
  add_to_path

  echo ""
  echo -e "${GREEN}${BOLD}Installation complete!${NC}"
  echo ""

  # Check if we need to reload shell
  if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo "To start using bfloo, run:"
    echo ""
    echo -e "  ${BOLD}source $(get_shell_profile)${NC}"
    echo ""
    echo "Or open a new terminal session."
  else
    echo "Run ${BOLD}bfloo --help${NC} to get started."
  fi

  echo ""
}

main "$@"
