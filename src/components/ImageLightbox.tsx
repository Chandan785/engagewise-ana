import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
}

const ImageLightbox = ({ isOpen, onClose, imageSrc, imageAlt }: ImageLightboxProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-none bg-transparent shadow-none overflow-hidden">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative"
            >
              <button
                onClick={onClose}
                className="absolute -top-12 right-0 z-50 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-colors"
                aria-label="Close lightbox"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
              <div className="rounded-xl overflow-hidden border-2 border-border/50 shadow-2xl bg-background">
                <img
                  src={imageSrc}
                  alt={imageAlt}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
              </div>
              <p className="text-center mt-4 text-sm text-muted-foreground">{imageAlt}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;
