 function triggerDiscordSync() {
   const toastContainer = document.getElementById('toast-container');
   const toast = document.createElement('div');
   toast.className = 'pointer-events-auto transform transition-all duration-300 translate-y-0 opacity-100 flex items-center gap-space-sm bg-surface-tier-2 px-space-md py-space-sm shadow-xl rounded border-l-2 border-primary';
   toast.innerHTML = `
     <span class="material-symbols-outlined text-primary text-[18px]">send</span>
     <div class="flex flex-col">
       <span class="font-body-medium text-body-medium text-text-primary">Live Dispatch Dispatched</span>
       <span class="font-body-code text-body-code text-text-secondary">Embed posted to ${document.getElementById('webhook-channel').value}</span>
     </div>
     <button onclick="this.parentElement.remove()" class="text-text-muted hover:text-text-primary ml-space-md">
       <span class="material-symbols-outlined text-[16px]">close</span>
     </button>
   `;
   toastContainer.appendChild(toast);
   setTimeout(() => {
     toast.style.opacity = '0';
     toast.style.transform = 'translateY(-10px)';
     setTimeout(() => toast.remove(), 300);
   }, 4000);
 }

 function copyMRTNote() {
   const mrtContent = `##### MethodRaidTools Note: Queen Ansurek M #####
P1: Cross Web assignments: G1 Left / G2 Right
P2 Platforms:
P1 (NW): Vaelin Skaarl Shadowblade Swiftstrike Eladria Zephyr Arcana
P2 (SE): Gorrash Malorne Kragor Lightwarden Chronos Pyralis Netherdawn
Gateways: Netherdawn (Mid->East) Hellfire (East->High)`;

   navigator.clipboard.writeText(mrtContent).then(() => {
     const toastContainer = document.getElementById('toast-container');
     const toast = document.createElement('div');
     toast.className = 'pointer-events-auto transform transition-all duration-300 translate-y-0 opacity-100 flex items-center gap-space-sm bg-surface-tier-2 px-space-md py-space-sm shadow-xl rounded border-l-2 border-team-templars';
     toast.innerHTML = `
       <span class="material-symbols-outlined text-team-templars text-[18px]">content_copy</span>
       <div class="flex flex-col">
         <span class="font-body-medium text-body-medium text-text-primary">MRT Note Copied</span>
         <span class="font-body-code text-body-code text-text-secondary">Ready to paste in /mrt note tab in-game</span>
       </div>
       <button onclick="this.parentElement.remove()" class="text-text-muted hover:text-text-primary ml-space-md">
         <span class="material-symbols-outlined text-[16px]">close</span>
       </button>
     `;
     toastContainer.appendChild(toast);
     setTimeout(() => {
       toast.style.opacity = '0';
       setTimeout(() => toast.remove(), 300);
     }, 3500);
   });
 }

 function autoFillSR() {
   const toastContainer = document.getElementById('toast-container');
   const toast = document.createElement('div');
   toast.className = 'pointer-events-auto transform transition-all duration-300 translate-y-0 opacity-100 flex items-center gap-space-sm bg-surface-tier-2 px-space-md py-space-sm shadow-xl rounded border-l-2 border-tier-myth';
   toast.innerHTML = `
     <span class="material-symbols-outlined text-tier-myth text-[18px]">sync</span>
     <div class="flex flex-col">
       <span class="font-body-medium text-body-medium text-text-primary">Soft-Reserves Synced</span>
       <span class="font-body-code text-body-code text-text-secondary">Roster cross-checked against 24 submitted sheets</span>
     </div>
     <button onclick="this.parentElement.remove()" class="text-text-muted hover:text-text-primary ml-space-md">
       <span class="material-symbols-outlined text-[16px]">close</span>
     </button>
   `;
   toastContainer.appendChild(toast);
   setTimeout(() => {
     toast.style.opacity = '0';
     setTimeout(() => toast.remove(), 300);
   }, 3500);
 }

 function updateDiscordPreview(val) {
   document.getElementById('discord-preview-note').innerText = val || "No operational note provided.";
 }

 function setPingRole(btn, roleText) {
   const buttons = btn.parentElement.querySelectorAll('button');
   buttons.forEach(b => {
     b.className = 'px-space-sm py-0.5 text-label-caps font-label-caps bg-surface-tier-2 text-text-muted hover:text-text-primary uppercase';
   });
   btn.className = 'px-space-sm py-0.5 text-label-caps font-label-caps bg-primary text-on-primary font-bold uppercase';
   document.getElementById('discord-preview-ping').innerText = roleText === 'None' ? '' : roleText;
 }

 function openFeedbackModal() {
   document.getElementById('feedback-modal').classList.remove('hidden');
   document.getElementById('feedback-modal').classList.add('flex');
 }

 function closeFeedbackModal() {
   document.getElementById('feedback-modal').classList.add('hidden');
   document.getElementById('feedback-modal').classList.remove('flex');
 }

 function selectFeedbackType(btn) {
   document.querySelectorAll('.feedback-type-btn').forEach(b => {
     b.className = 'feedback-type-btn py-1 text-center font-label-caps text-label-caps uppercase bg-surface-tier-2 text-text-secondary hover:text-text-primary';
   });
   btn.className = 'feedback-type-btn py-1 text-center font-label-caps text-label-caps uppercase bg-primary text-on-primary font-bold';
 }

 function submitFeedback() {
   closeFeedbackModal();
   const toastContainer = document.getElementById('toast-container');
   const toast = document.createElement('div');
   toast.className = 'pointer-events-auto transform transition-all duration-300 translate-y-0 opacity-100 flex items-center gap-space-sm bg-surface-tier-2 px-space-md py-space-sm shadow-xl rounded border-l-2 border-primary';
   toast.innerHTML = `
     <span class="material-symbols-outlined text-primary text-[18px]">mark_email_read</span>
     <div class="flex flex-col">
       <span class="font-body-medium text-body-medium text-text-primary">Dispute Logged to Officer Vault</span>
       <span class="font-body-code text-body-code text-text-secondary">Incident #RTB-902 assigned to Vaelstrasz</span>
     </div>
     <button onclick="this.parentElement.remove()" class="text-text-muted hover:text-text-primary ml-space-md">
       <span class="material-symbols-outlined text-[16px]">close</span>
     </button>
   `;
   toastContainer.appendChild(toast);
   setTimeout(() => {
     toast.style.opacity = '0';
     setTimeout(() => toast.remove(), 300);
   }, 4000);
 }

 function toggleSettingsModal() {
   const modal = document.getElementById('settings-modal');
   if (modal.classList.contains('hidden')) {
     modal.classList.remove('hidden');
     modal.classList.add('flex');
   } else {
     modal.classList.add('hidden');
     modal.classList.remove('flex');
   }
 }
