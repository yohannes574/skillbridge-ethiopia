import { X } from 'lucide-react';

const Modal = ({ title, onClose, children, maxWidth = 'max-w-lg' }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className={`modal ${maxWidth}`} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center">
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default Modal;
