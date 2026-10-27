import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../../lib/utils';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { side?: 'top' | 'right' | 'bottom' | 'left' }>(({ side = 'right', className, ...props }, ref) => (
  <DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/40" /><DialogPrimitive.Content ref={ref} className={cn('fixed z-50 bg-white shadow-xl focus:outline-none', side === 'right' && 'inset-y-0 right-0 h-full w-[min(90vw,400px)] border-l p-5', side === 'left' && 'inset-y-0 left-0 h-full w-[min(90vw,400px)] border-r p-5', side === 'top' && 'inset-x-0 top-0 border-b p-5', side === 'bottom' && 'inset-x-0 bottom-0 border-t p-5', className)} {...props} /></DialogPrimitive.Portal>
));
SheetContent.displayName = 'SheetContent';
