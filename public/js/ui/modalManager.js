// Modal Dialog UI Manager (Single Responsibility Principle)

export const modalManager = {
  openModal(modal) {
    if (modal) modal.classList.add('active');
  },

  closeModal(modal) {
    if (modal) modal.classList.remove('active');
  }
};
